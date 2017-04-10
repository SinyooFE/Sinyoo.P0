/**
* Mapping选项值设置页面
*/
import { Directive, Component, OnInit, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef, ViewContainerRef } from '@angular/core';
import { Location } from "@angular/common";
import { EventManager } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { Observable, Subject } from 'rxjs';

import { QueryAuthorizeInfo, AuthorizeInfo, MappingService, BaseService } from '../../services'

import { TabFunctionModel } from '../../models';
import {
    StandardFieldType,
    FieldOptionMapStatus,
    FieldSourceOptionStatus,
    FieldTargetOptionStatus
} from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'mapping-match-option',
    styleUrls: ['mapping-match-option.component.css'],
    templateUrl: 'mapping-match-option.component.html'
})
export class MappingMatchOptionComponent implements OnInit, AfterViewInit {
    /**
     * mappingdId、树信息、第一条映射信息
     * T_(目标) S_(源) D_(放弃)等字段是辅助用的，一般不在返回信息里
     */
    optionMapping = <server.OptionMappingViewModel>{
        MappingID: 0,
        Fields: [],
        FirstMapping: <server.SourceOptionMapping>{
            SourceValues: [],
            OptionValues: [],
            DiscardSourceValues: []
        }
    };
    /**
     * 树ID
     */
    mappingTreeId = 'optionMappingTreeId';
    /**
     * 树对象
     */
    zTreeObj = null;
    /**
     * 树搜索参数
     */
    treeSearchParam = { fieldName: '', fieldStatus: FieldOptionMapStatus.无.toString(), searchType: 'tree' };
    /**
     * 源搜索参数
     */
    sourceSearchParam = { fieldName: '', fieldIsMapping: false, searchType: 'source' };
    /**
     * 目标搜索参数
     */
    targetSearchParam = { fieldName: '', searchType: 'target' };
    /**
     * 搜索
     */
    searchSubject = new Subject<any>();
    /**
     * 关联表信息
     */
    associativeTableDomains: Array<server.AssociateTableDomainViewModel> = [];
    /**
     * 关联表字段
     */
    associativeFieldMappings: Array<server.AssociateMappingViewModel> = [];
    /**
     * 域下的字段字典
     */
    domainFieldsDict = new Array();
    /**
     * tab菜单
     */
    currentEditorTab: TabFunctionModel;
    mappingEditorTab: TabFunctionModel[] = [];
    //枚举
    enumFieldOptionMapStatus = FieldOptionMapStatus;
    enumFieldSourceOptionStatus = FieldSourceOptionStatus;
    enumFieldTargetOptionStatus = FieldTargetOptionStatus;
    //选项值映射
    @ViewChildren('sourceOptionItem')
    sourceOptionItem;
    @ViewChildren('targetOptionItem')
    targetOptionItem;
    @ViewChild('dropOptionItem')
    dropOptionItem;
    //关联表
    @ViewChildren('associativeDomainItem')
    associativeDomainItem;
    @ViewChildren('associativeMappingItem')
    associativeMappingItem;
    //内容高度
    editorHeight = 0;

    constructor(private router: ActivatedRoute,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private modal: Modal,
        private location: Location,
        private baseService: BaseService,
        private mappingService: MappingService,
        private eventManager: EventManager
    ) {
        overlay.defaultViewContainer = vcRef;

        this.mappingEditorTab.push(new TabFunctionModel('option', '选项值'));
        this.mappingEditorTab.push(new TabFunctionModel('relate', '关联表'));
        this.currentEditorTab = this.mappingEditorTab[0];

        this.router.params.subscribe(urlParam => {
            this.mappingService.getOptionMapping(+urlParam["mappingid"])
                .subscribe((data) => {
                    console.log(data);
                    this.optionMapping = data;
                    //设置S_Status
                    this.optionMapping.FirstMapping.SourceValues.forEach((item) => {
                        this.setSourceOptionCheckBoxStatus(item);
                    });

                    this.initMappingTree();
                });
        });
    }

    ngOnInit(): void {

    }

    ngAfterViewInit() {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 300;
            });

        //搜索
        this.searchSubject.debounceTime(1000)
            .distinctUntilChanged((beforeData, nowData) => {
                return (beforeData.searchType === nowData.searchType &&
                    beforeData.fieldName === nowData.fieldName &&
                    beforeData.fieldStatus === nowData.fieldStatus &&
                    beforeData.fieldIsMapping === nowData.fieldIsMapping);
            })
            .subscribe((searchData) => {
                console.log(searchData);
                switch (searchData.searchType) {
                    case 'source':
                        {
                            if (searchData.fieldIsMapping) {
                                this.optionMapping.FirstMapping.SourceValues.forEach((value) => {
                                    value["S_IsHidden"] = !(value.ValueName.indexOf(searchData.fieldName) > -1 &&
                                        !value.IsMapping);
                                });
                            } else {
                                this.optionMapping.FirstMapping.SourceValues.forEach((value) => {
                                    value["S_IsHidden"] = !(value.ValueName.indexOf(searchData.fieldName) > -1);
                                });
                            }
                        };
                        break;
                    case 'target':
                        {
                            this.optionMapping.FirstMapping.OptionValues.forEach((value) => {
                                value["T_IsHidden"] = !(value.OptionName.indexOf(searchData.fieldName) > -1);
                            });
                        };
                        break;
                    default:
                        {
                            if (!_.isNil(this.zTreeObj)) {
                                if (searchData.fieldName === '' && searchData.fieldStatus === '0') {
                                    //收起树节点
                                    this.zTreeObj.expandAll(false);
                                    //所有隐蔽的节点显示出来
                                    let hiddenNodes = this.zTreeObj.getNodesByParam('isHidden', true);
                                    this.zTreeObj.showNodes(hiddenNodes);
                                    //设置选中的节点
                                    this.setNodeSelected(true);
                                } else {
                                    //isSingle = true 返回 第一个找到的节点数据 JSON，无结果时返回 null
                                    //isSingle = false 返回 节点数据集合 Array(JSON) ，无结果时返回[]
                                    let searchNodes = this.zTreeObj.getNodesByFilter((node) => {
                                        //返回所有需要显示的节点
                                        let checkRes = false;
                                        if (searchData.fieldStatus === '0') {
                                            checkRes = node.FieldType === StandardFieldType.普通变量 &&
                                                node.FieldName.indexOf(searchData.fieldName) > -1;
                                        } else {
                                            checkRes = node.FieldType === StandardFieldType.普通变量 &&
                                                node.MapStatus.toString() === searchData.fieldStatus &&
                                                node.FieldName.indexOf(searchData.fieldName) > -1;
                                        }

                                        if (checkRes) {
                                            if (node.isHidden) {
                                                this.zTreeObj.showNode(node);
                                            }
                                            return true;
                                        } else {
                                            if (!node.isHidden) {
                                                this.zTreeObj.hideNode(node);
                                            }
                                            return false;
                                        }
                                    },
                                        false);
                                    //根据查找出来的节点，找出路径并全部显示
                                    searchNodes.forEach((node, index, array) => {
                                        if (node.isFirstNode) {
                                            let path = node.getPath(node);
                                            if (path.length > 0) {
                                                this.zTreeObj.showNodes(path);
                                            }
                                        }
                                    });
                                    //最后全部展开树节点
                                    this.zTreeObj.expandAll(true);
                                }
                            }
                        }
                }
            });

        //源拖拽
        this.sourceOptionItem.changes.subscribe((optionItems) => {
            optionItems.toArray()
                .forEach((itemDiv) => {
                    this.eventManager.addEventListener(itemDiv.nativeElement,
                        'mouseenter',
                        (event) => {
                            let $dragEle = $(event.target);
                            //如果目标不包含禁用样式，并且未被初始化过才初始化
                            //如果
                            if (!$dragEle.hasClass('disable') && _.isNil($dragEle.draggable("instance"))) {
                                $dragEle.draggable({
                                    scope: 'sourceOption',
                                    zIndex: 998,
                                    opacity: 0.8,
                                    cursorAt: { top: 10, left: 10 },
                                    appendTo: '.listContainer',
                                    helper: (event) => {
                                        //找出被勾选的源值
                                        let selectedOptionNames = '';
                                        this.optionMapping.FirstMapping.SourceValues.forEach((itemValue) => {
                                            if (itemValue["S_Status"] === '10') {
                                                selectedOptionNames += `${itemValue.ValueName}|`;
                                            }
                                        });
                                        selectedOptionNames = _.trim(selectedOptionNames, '|');
                                        //如果已选择的选项里不包含$dragEle，则只拖拽当前
                                        //否则，拖动多个选项
                                        if ((`|${selectedOptionNames}|`)
                                            .indexOf(`|${$dragEle.attr('title')}|`) ===
                                            -1) {
                                            selectedOptionNames = `${$dragEle.attr('title')}`;
                                        }
                                        return $(`<span>${selectedOptionNames}</span>`);
                                    }
                                });
                            } else if ($dragEle.hasClass('disable') && !_.isNil($dragEle.draggable("instance"))) {
                                $dragEle.draggable('destroy');
                            }
                        });
                });
        });

        //目标放置
        this.targetOptionItem.changes.subscribe((optionItems) => {
            optionItems.toArray()
                .forEach((itemDiv) => {
                    let $dropEle = $(itemDiv.nativeElement).find('.item');
                    //如果目标包含禁用样式，并且未被初始化过才初始化
                    if (!$dropEle.parent().hasClass('disable') && _.isNil($dropEle.droppable("instance"))) {
                        $dropEle.droppable({
                            activeClass: 'currentTarget',
                            scope: 'sourceOption',
                            drop: (event, ui) => {
                                let dragSourceOptionNames: Array<string> = ui.helper.text().split('|');
                                if (dragSourceOptionNames.length > 0) {
                                    let dropTargetOption = _.find(this.optionMapping.FirstMapping.OptionValues,
                                        (item) => {
                                            return `${$dropEle.data('optionname')}` === `target_${item.OptionName}`;
                                        });

                                    //找到目标
                                    if (!_.isNil(dropTargetOption)) {
                                        this.mappingService
                                            .updateFieldValueOptionMapping(this.optionMapping.MappingID,
                                            this.optionMapping.FirstMapping.FieldID,
                                            dropTargetOption.OptionName,
                                            dragSourceOptionNames)
                                            .subscribe((data) => {
                                                console.log(data);

                                                _.map(dragSourceOptionNames, (sourceName) => {
                                                    let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                                        (item) => {
                                                            return item.ValueName === sourceName;
                                                        });

                                                    if (!_.isNil(tempSourceOption)) {
                                                        //修改状态
                                                        tempSourceOption.IsMapping = true;
                                                        this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                                        //添加
                                                        dropTargetOption.SourceValues.push(tempSourceOption);
                                                    }
                                                });
                                            });
                                    }
                                }
                            }
                        });
                    }
                });
        });

        //放弃放置
        $(this.dropOptionItem.nativeElement)
            .droppable({
                activeClass: 'currentTarget',
                scope: 'sourceOption',
                drop: (event, ui) => {
                    let dragSourceOptionNames: Array<string> = ui.helper.text().split('|');
                    if (dragSourceOptionNames.length > 0) {
                        this.mappingService
                            .updateDiscardFieldValueOptionMapping(this.optionMapping.MappingID,
                            this.optionMapping.FirstMapping.FieldID,
                            dragSourceOptionNames)
                            .subscribe((data) => {
                                console.log(data);

                                _.map(dragSourceOptionNames,
                                    (optionName) => {
                                        let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                            (item) => {
                                                return item.ValueName === optionName;
                                            });
                                        if (!_.isNil(tempSourceOption)) {
                                            //修改状态
                                            tempSourceOption.IsMapping = true;
                                            this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                            //添加
                                            this.optionMapping.FirstMapping.DiscardSourceValues.push(tempSourceOption);
                                        }
                                    });
                            });
                    }
                }
            });

        //关联表拖拽
        this.associativeDomainItem.changes.subscribe((domainItem) => {
            domainItem.toArray()
                .forEach((itemDiv) => {
                    this.eventManager.addEventListener(itemDiv.nativeElement,
                        'mouseenter',
                        (event) => {
                            let $dragEle = $(event.target);
                            //如果目标不包含禁用样式，并且未被初始化过才初始化
                            if (!$dragEle.hasClass('disable') && _.isNil($dragEle.draggable("instance"))) {
                                $dragEle.draggable({
                                    scope: 'relateDomain',
                                    zIndex: 998,
                                    opacity: 0.8,
                                    cursorAt: { top: 10, left: 10 },
                                    appendTo: '.relateSummary',
                                    helper: (event) => {
                                        return $(`<span data-domainid="${$dragEle.data('domainid')}">${$dragEle
                                            .attr('title')}</span>`);
                                    }
                                });
                            } else if ($dragEle.hasClass('disable') && !_.isNil($dragEle.draggable("instance"))) {
                                $dragEle.draggable('destroy');
                            }
                        });
                });
        });

        //关联表放置
        this.associativeMappingItem.changes.subscribe((mappingItem) => {
            mappingItem.toArray()
                .forEach((itemDiv) => {
                    let $dropEle = $(itemDiv.nativeElement).find('.relateDrop');
                    //如果目标包含禁用样式，并且未被初始化过才初始化
                    if (!$dropEle.hasClass('disable') && _.isNil($dropEle.droppable("instance"))) {
                        $dropEle.droppable({
                            activeClass: 'currentTarget',
                            scope: 'relateDomain',
                            drop: (event, ui) => {
                                let $targetMapping = $(event.target);
                                let domainId = ui.helper.data('domainid').toString();
                                this.updateAssosciativeMapping(+$targetMapping.data('index'),
                                    $targetMapping.data('flag').toString(), domainId);
                            }
                        });
                    }
                });
        });
    }

    /**
     * 
     */
    initMappingTree() {
        if (!_.isNil(this.optionMapping.Fields)) {
            let setting = {
                view: {
                    showLine: false,
                    showIcon: false,
                    addDiyDom: (treeId, treeNode) => {
                        //字段类型图标
                        let fieldIconHtml = '';
                        switch (treeNode.FieldType) {
                            case StandardFieldType.域:
                                {
                                    fieldIconHtml = `<span title="${StandardFieldType[StandardFieldType.域]
                                        }" class="icon iconfont">&#xe68d;</span>`;
                                };
                                break;
                            case StandardFieldType.普通变量:
                                {
                                    fieldIconHtml = `<span title="${StandardFieldType[StandardFieldType.普通变量]
                                        }" class="icon iconfont">&#xe66f;</span>`;
                                };
                                break;
                        }
                        let aObj = $(`#${treeNode.tId}_a`);
                        if (fieldIconHtml !== '') {
                            aObj.prepend(fieldIconHtml);
                        }
                        //字段状态内容
                        if (treeNode.MapStatus !== FieldOptionMapStatus.无) {
                            aObj
                                .append(`<div class="mappingMatch_Tip mappingMatch_sTip">${FieldOptionMapStatus[
                                treeNode.MapStatus]}</div>`);
                        }
                    }
                },
                data: {
                    key: {
                        name: "FieldName",
                        children: "Children"
                    },
                    simpledata: {
                        enable: false,
                        idKey: "FieldID",
                        pIdKey: "FieldID"
                    }
                },
                callback: {
                    onClick: (event, treeId, treeNode) => {
                        if (treeNode.FieldID !== this.optionMapping.FirstMapping.FieldID) {
                            this.mappingService.getFieldOptionMapping(this.optionMapping.MappingID, treeNode.FieldID)
                                .subscribe((data) => {
                                    this.optionMapping.FirstMapping = data;
                                    //设置S_Status
                                    this.optionMapping.FirstMapping.SourceValues.forEach((item) => {
                                        this.setSourceOptionCheckBoxStatus(item);
                                    });
                                    console.log(this.optionMapping);
                                });
                        }
                    }
                }
            };
            //调用zTree初始化方法，开始渲染
            this.zTreeObj = $.fn.zTree.init($(`#${this.mappingTreeId}`), setting, this.optionMapping.Fields);
            //设置选中的节点
            this.setNodeSelected();
        }
    }

    /**
     * 初始化关联表信息
     */
    initAssociative() {
        if (_.isNil(this.associativeTableDomains) || this.associativeTableDomains.length === 0) {
            let associateObservable = this.mappingService.getAssociateTableDomain(this.optionMapping.MappingID);
            let mappingObservable = this.mappingService.getAssociations(this.optionMapping.MappingID);
            Observable.forkJoin(associateObservable, mappingObservable)
                .subscribe((result) => {
                    this.associativeTableDomains = result[0];
                    this.associativeFieldMappings = result[1];
                    //初始化下拉Fields
                    this.setAssosciativeFields();
                });
        }
    }

    /**
     * 展开选中的节点,并设置选中的状态
     */
    setNodeSelected(isSearch = false) {
        if (!_.isNil(this.optionMapping.FirstMapping)) {
            let node = this.zTreeObj.getNodeByParam('FieldID', this.optionMapping.FirstMapping.FieldID);
            if (!_.isNil(node) && !node.IsHidden) {
                if (isSearch) {
                    this.zTreeObj.expandNode(node.getParentNode());
                }
                this.zTreeObj.selectNode(node);
            }
        } else {
            this.optionMapping.FirstMapping = <server.SourceOptionMapping>{};
        }
    }

    /**
     * 是否选择全部
     * @param isSelectAll
     */
    selectAllSourceOption(isSelectAll: boolean) {
        this.optionMapping.FirstMapping.SourceValues.forEach((item) => {
            if (isSelectAll && item["S_Status"] === '00') {
                item["S_Status"] = '10';
            } else if (!isSelectAll && item["S_Status"] === '10') {
                item["S_Status"] = '00';
            }
        });
    }

    /**
     * 设置源选项值的checkbox状态(S_Status)
     * 0 未勾选 未禁用 00
     * 1 未勾选 已禁用 01
     * 2 已勾选 未禁用 10
     * 3 已勾选 已禁用 11
     */
    setSourceOptionCheckBoxStatus(item: server.SourceValue, status?: string) {
        console.log();
        if (status === undefined) {
            item["S_Status"] = `${+item.IsMapping}${+(item
                .IsMapping ||
                item.ValueStatus === FieldSourceOptionStatus.删除)}`;
        } else {
            item["S_Status"] = status;
        }
    }

    /**
     * 切换checkbox状态
     * @param item
     */
    changeSourceOptionCheckBoxStatus(item: server.SourceValue) {
        this.setSourceOptionCheckBoxStatus(item, item["S_Status"] === '10' ? '00' : '10');
    }

    /**
     * 切换tab页
     * @param item
     */
    changSelectedTab(tab: TabFunctionModel): void {
        this.currentEditorTab = tab;
        if (this.currentEditorTab.key === 'relate') {
            this.initAssociative();
        }
    }

    /**
     * 搜索
     */
    search(srcType) {
        let searchData;
        switch (srcType) {
            case 'source':
                {
                    searchData = _.cloneDeep(this.sourceSearchParam);
                };
                break;
            case 'target':
                {
                    searchData = _.cloneDeep(this.targetSearchParam);
                };
                break;
            default:
                {
                    searchData = _.cloneDeep(this.treeSearchParam);
                };
        }
        this.searchSubject.next(searchData);
    }

    /**
     * 源选项值排序
     * @param isDesc
     */
    sourceSort(isAsc: boolean) {
        if (this.optionMapping.FirstMapping["S_IsAsc"] === isAsc) return;

        this.optionMapping.FirstMapping["S_IsAsc"] = isAsc;
        this.optionMapping.FirstMapping.SourceValues.sort((a, b) => {
            if (a.ValueCount > b.ValueCount) {
                return isAsc ? 1 : -1;
            } else if (a.ValueCount < b.ValueCount) {
                return isAsc ? -1 : 1;
            } else {
                return 0;
            }
        });
    }

    /**
     * 移除目标选项下的一个item
     * @param targetOption
     * @param removeItem
     */
    deleteTargetOptionItem(targetOption: server.OptionValue, removeItem: string) {
        this.modal.confirm()
            .title('提示')
            .message('确定删除映射关系吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open()
            .then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.mappingService.deleteFieldValueOptionMapping(this.optionMapping.MappingID,
                            this.optionMapping.FirstMapping.FieldID,
                            targetOption.OptionName,
                            removeItem)
                            .subscribe((data) => {
                                console.log(data);
                                //从数组中删除
                                _.remove(targetOption.SourceValues, (item) => { return item.ValueName === removeItem; });
                                //更新源的IsMapping为false
                                let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                    (item) => {
                                        return item.ValueName === removeItem;
                                    });
                                if (!_.isNil(tempSourceOption)) {
                                    tempSourceOption.IsMapping = false;
                                    this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 清空目标选项下的item
     * @param targetOption
     */
    emptyTargetOptionItem(targetOption: server.OptionValue) {
        this.modal.confirm()
            .title('提示')
            .message('确定要清空所有映射关系吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open()
            .then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.mappingService.emptyFieldValueOptionMapping(this.optionMapping.MappingID,
                            this.optionMapping.FirstMapping.FieldID,
                            targetOption.OptionName).subscribe((data) => {
                                //先更新状态
                                let waitUpdateValueNames = [];
                                _.each(targetOption.SourceValues,
                                    (removeItem) => {
                                        let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                            (item) => {
                                                return item.ValueName === removeItem.ValueName &&
                                                    item.ValueStatus !== FieldSourceOptionStatus.删除;
                                            });

                                        if (!_.isNil(tempSourceOption)) {
                                            tempSourceOption.IsMapping = false;
                                            this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                            waitUpdateValueNames.push(removeItem.ValueName);
                                        }
                                    });
                                //一起删除
                                _.remove(targetOption.SourceValues, (removeItem) => {
                                    return waitUpdateValueNames.indexOf(removeItem.ValueName) > -1;
                                });
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 移除drop区域下的一个item
     * @param removeItem
     */
    deleteDropOptionItem(removeItem: string) {
        this.modal.confirm()
            .title('提示')
            .message('确定删除吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open()
            .then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.mappingService.deleteDiscardFieldValueOptionMapping(this.optionMapping.MappingID,
                            this.optionMapping.FirstMapping.FieldID,
                            removeItem)
                            .subscribe((data) => {
                                //从数组中删除
                                _.remove(this.optionMapping.FirstMapping.DiscardSourceValues,
                                    (item) => { return item.ValueName === removeItem; });
                                //更新源的IsMapping为false
                                let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                    (item) => {
                                        return item.ValueName === removeItem;
                                    });
                                if (!_.isNil(tempSourceOption)) {
                                    tempSourceOption.IsMapping = false;
                                    this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 清空drop区域下的item
     */
    emptyDropOptionItem() {
        this.modal.confirm()
            .title('提示')
            .message('确定要清空吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open()
            .then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.mappingService.emptyDiscardFieldValueOptionMapping(this.optionMapping.MappingID,
                            this.optionMapping.FirstMapping.FieldID)
                            .subscribe((data) => {
                                //先更新状态，得到需要删除的数据
                                let waitUpdateValueNames = [];
                                _.each(this.optionMapping.FirstMapping.DiscardSourceValues,
                                    (removeItem) => {
                                        let tempSourceOption = _.find(this.optionMapping.FirstMapping.SourceValues,
                                            (item) => {
                                                return item.ValueName === removeItem.ValueName &&
                                                    item.ValueStatus !== FieldSourceOptionStatus.删除;
                                            });

                                        if (!_.isNil(tempSourceOption)) {
                                            tempSourceOption.IsMapping = false;
                                            this.setSourceOptionCheckBoxStatus(tempSourceOption);
                                            waitUpdateValueNames.push(removeItem.ValueName);
                                        }
                                    });
                                //最后一起删除
                                _.remove(this.optionMapping.FirstMapping.DiscardSourceValues, (removeItem) => {
                                    return waitUpdateValueNames.indexOf(removeItem.ValueName) > -1;
                                });
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 设置映射关系的下拉选择Fields
     * 获取数据后执行
     * @param fieldMapping 需要设置FirstFields 和 SecondFields的映射关系
     * 不传入的话更新所有的映射关系
     */
    setAssosciativeFields(fieldMapping?: server.AssociateMappingViewModel) {
        if (this.domainFieldsDict.length === 0) {
            this.associativeTableDomains.forEach((item) => {
                this.domainFieldsDict[item.DomainID] = item.Fields;
            });
        }

        if (_.isNil(fieldMapping)) {
            this.associativeFieldMappings.forEach((mappingItem) => {
                mappingItem["FirstFields"] = this.domainFieldsDict[mappingItem.FirstDomainID];
                mappingItem["SecondFields"] = this.domainFieldsDict[mappingItem.SecondDomainID];
            });
        } else {
            fieldMapping["FirstFields"] = this.domainFieldsDict[fieldMapping.FirstDomainID];
            fieldMapping["SecondFields"] = this.domainFieldsDict[fieldMapping.SecondDomainID];
        }
    }

    /**
     * 添加关联表映射
     */
    addAssosciativeMapping() {
        this.associativeFieldMappings.push(<server.AssociateMappingViewModel>{
            AssociationID: 0
        });
    }

    /**
     * 更新关联表映射
     * @param index 映射关系下标
     * @param flag  域1|域2
     * @param domainId 域Id
     */
    updateAssosciativeMapping(index: number, flag: string, domainId: string) {
        let tempDomain = _.find(this.associativeTableDomains, (item) => {
            return item.DomainID === domainId;
        });

        if (!_.isNil(tempDomain)) {
            let tempMapping = _.cloneDeep(this.associativeFieldMappings[index]);
            //设置改变的值
            if (flag === 'first' && domainId !== tempMapping.FirstDomainID) {
                tempMapping.FirstDomainID = tempDomain.DomainID;
                tempMapping.FirstDomainName = tempDomain.DomainName;

                tempMapping["FirstFields"] = tempDomain.Fields;
                tempMapping.FirstFieldID = tempDomain.Fields[0].FieldID;
                tempMapping.FirstFieldName = tempDomain.Fields[0].FieldName;
            } else if (flag === 'second' && domainId !== tempMapping.SecondDomainID) {
                tempMapping.SecondDomainID = tempDomain.DomainID;
                tempMapping.SecondDomainName = tempDomain.DomainName;

                tempMapping["SecondFields"] = tempDomain.Fields;
                tempMapping.SecondFieldID = tempDomain.Fields[0].FieldID;
                tempMapping.SecondFieldName = tempDomain.Fields[0].FieldName;
            }

            if (tempMapping.AssociationID === 0) {
                this.mappingService.addAssociations(this.optionMapping.MappingID, tempMapping)
                    .subscribe((data) => {
                        this.associativeFieldMappings[index] = data;
                    });
            } else {
                this.mappingService.updateAssociations(this.optionMapping.MappingID, tempMapping.AssociationID, tempMapping)
                    .subscribe((data) => {
                        this.associativeFieldMappings[index] = data;
                    });
            }
        }
    }

    /**
     * 删除关联表映射
     * @param item
     */
    deleteAssosciativeMapping(item: server.AssociateMappingViewModel) {
        this.mappingService.deleteAssociations(this.optionMapping.MappingID, item.AssociationID)
            .subscribe((data) => {
                _.remove(this.associativeFieldMappings, item);
            });
    }

    /**
     * 保存
     */
    saveOption() {
        this.mappingService.updateFieldOptionMapping(this.optionMapping.MappingID, this.optionMapping.FirstMapping.FieldID).subscribe((data) => {
            this.showAlert('保存成功！');
        });
    }

    /**
     * 提交
     */
    submitOption() {
        this.mappingService.submitOptionMapping(this.optionMapping.MappingID).subscribe((data) => {
            this.showAlert('提交成功！');
        });
    }

    /**
     * 返回
     */
    back() {
        this.location.back();
    }

    /**
     * 提示框
     * @param message
     * @param type
     */
    showAlert(message: string, type = 0): void {
        this.modal.alert()
            .title(type == 0 ? '提示' : '警告')
            .message(message)
            .okBtn('确定')
            .size('sm')
            .open();
    }
}