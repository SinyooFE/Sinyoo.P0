
import { Component, Output, ViewChild, EventEmitter, OnInit, AfterViewInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Overlay, overlayConfigFactory, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { ConceptTreeTypeSelectComponent, ConceptTreeTypeSelectContext } from '../../components/terminology/concept-tree-typeselect.component';
import { QueryAuthorizeInfo, AuthorizeInfo, BaseService, ReportConceptDetail, TerminologyService } from '../../services';

import { ConceptOperateType, MatchType, DataStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'concept-tree',
    styleUrls: ['concept-tree.component.css'],
    templateUrl: 'concept-tree.component.html'
})

export class ConceptTreeComponent implements CloseGuard, OnInit, AfterViewInit {
    private conceptTreeId = 'conceptTree';
    private zTreeObj = null;

    private conceptTypeTreeId = 'conceptTypeSearchTree';
    private conceptTypeTreeData = null;
    private selectedConceptType = [];

    //概念树数据
    conceptTreeData: any;
    //是否搜索
    isSearch = false;
    //搜索结果条数
    searchCount = 0;
    //概念搜索内容
    searchFilter = '';
    //
    searchTerms = new Subject<string>();

    //权限
    authorizeInfo = new AuthorizeInfo();

    //编辑区域高度
    editorHeight = 0;

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private router: Router,
        private location: Location,
        private baseService: BaseService,
        private terminologyService: TerminologyService,
        private queryAuthorizeInfo: QueryAuthorizeInfo,
        public modal: Modal) {

        overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {
        //权限
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.authorizeInfo = <AuthorizeInfo>auth;
            console.log(this.authorizeInfo);

            //设置概念树
            this.setConceptTreeData();
        });

        //搜索
        this.searchTerms.debounceTime(1000).distinctUntilChanged()
            .subscribe(
            (data) => {
                //layer.closeAll('tips');
                this.searchFilter = data;
                this.setConceptTreeData();
            });
    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 150;
            });

        //概念编辑提交后更新
        this.terminologyService.reportConceptDetail
            .subscribe((data) => {
                console.log(data);
                console.log(this.zTreeObj);
                let reportConceptDetail = data as ReportConceptDetail;
                switch (reportConceptDetail.action) {
                    case ConceptOperateType.添加树节点:
                        {
                            let tempParentNode = this.zTreeObj.getNodeByParam('id', reportConceptDetail.detail.PConceptID, null);
                            let newAddNode = {
                                id: reportConceptDetail.detail.ConceptID,
                                name: reportConceptDetail.detail.ConceptName,
                                open: false,
                                ConceptSort: reportConceptDetail.detail.ConceptSort,
                                PConceptID: reportConceptDetail.detail.PConceptID,
                                isParent: true,
                                children: [],
                                DataStatus: reportConceptDetail.detail.DataStatus
                            };
                            this.zTreeObj.addNodes(tempParentNode, -1, newAddNode);
                        }; break;
                    case ConceptOperateType.修改树节点:
                        {
                            let tempNode = this.zTreeObj.getNodeByParam('id', reportConceptDetail.detail.ConceptID, null);
                            if (tempNode != null) {
                                tempNode.name = reportConceptDetail.detail.ConceptName;
                                tempNode.ConceptSort = reportConceptDetail.detail.ConceptSort;
                                tempNode.DataStatus = reportConceptDetail.detail.DataStatus;
                                this.zTreeObj.updateNode(tempNode, false);
                            }
                        }; break;
                    case ConceptOperateType.删除树节点:
                        {
                            let tempNode = this.zTreeObj.getNodeByParam('id', reportConceptDetail.detail.ConceptID, null);
                            if (tempNode != null) {
                                this.zTreeObj.removeNode(tempNode, false);
                            }
                        }; break;
                }
            });
    }

    /**
     * 概念树加载
     */
    setConceptTreeData() {
        //概念类型搜索
        let tempIds = '';
        _.each(this.selectedConceptType, (item) => {
            if (tempIds === '') {
                tempIds += item;
            } else {
                tempIds += `,${item}`;
            }
        });

        //设置是否搜索
        this.isSearch = (this.searchFilter !== '' || tempIds !== '');

        this.terminologyService.getConceptTreeData('', this.searchFilter, tempIds)
            .subscribe((data) => {
                //console.log(data);
                if (this.isSearch) {
                    this.searchCount = data.SearchCount;
                    this.conceptTreeData = data.Result;
                } else {
                    this.searchCount = 0;
                    this.conceptTreeData = data;
                }

                //初始化树
                let setting = {
                    view: {
                        showLine: false,
                        showIcon: false,
                        addDiyDom: (treeId, treeNode) => {
                            this.zTreeAddDiyDom(treeId, treeNode);
                        },
                        addHoverDom: (treeId, treeNode) => {
                            this.zTreeAddHoverDom(treeId, treeNode);
                        },
                        removeHoverDom: (treeId, treeNode) => {
                            this.zTreeRemoveHoverDom(treeId, treeNode);
                        }
                    },
                    edit: {
                        drag: {
                            isCopy: false,
                            isMove: this.authorizeInfo.P0_DragAndSortConcept
                        },
                        enable: true,
                        showRemoveBtn: false,
                        showRenameBtn: false
                    },
                    callback: {
                        onExpand: (event, treeId, treeNode) => {
                            this.zTreeOnExpland(event, treeId, treeNode);
                        },
                        onClick: (event, treeId, treeNode) => {
                            this.zTreeOnClick(event, treeId, treeNode);
                        },
                        beforeDrag: (treeId, treeNodes) => {
                            return this.zTreeBeforeDrag(treeId, treeNodes);
                        },
                        beforeDrop: (treeId, treeNodes, targetNode, moveType) => {
                            return this.zTreeBeforeDrop(event, treeId, treeNodes, targetNode, moveType);
                        },
                        onDrop: (event, treeId, treeNodes, targetNode, moveType) => {
                            this.zTreeOnDrop(event, treeId, treeNodes, targetNode, moveType);
                        }
                    }
                };

                this.zTreeObj = $.fn.zTree.init($(`#${this.conceptTreeId}`), setting, this.conceptTreeData);
            });
    }

    /**
     * 显示概念类型搜索弹出框
     * @param event
     */
    showConceptTypeFilter(): void {
        if (_.isNil(this.conceptTypeTreeData)) {
            this.terminologyService.getConceptTypes()
                .subscribe((rep) => {
                    this.conceptTypeTreeData = rep;
                    this.loadConceptTypeModal();
                });
        } else {
            this.loadConceptTypeModal();
        }
    }

    /**
     * 概念类型树加载
     */
    loadConceptTypeModal(): void {
        let conceptTypeModal = this.modal.open(ConceptTreeTypeSelectComponent,
            overlayConfigFactory(<ConceptTreeTypeSelectContext>{
                conceptTypeData: this.conceptTypeTreeData,
                selectedConceptType: this.selectedConceptType
            }, BSModalContext));

        conceptTypeModal.then((data) => {
            data.result.then((ret) => {
                if (ret.IsOk) {
                    this.selectedConceptType = ret.SelectedType;
                    this.setConceptTreeData();
                }
            }).catch(() => { });
        });
    }

    /**
     * 添加自定义DOM
     * @param treeId
     * @param treeNode
     */
    zTreeAddDiyDom(treeId, treeNode) {
        //外部概念不显示tips
        if (this.isSearch && treeNode.MatchType !== MatchType.无 && !treeNode.IsExternal) {
            const aObj = $('#' + treeNode.tId + '_a');
            aObj.addClass('curSelectedNode2');

            //匹配类型是概念名称和概念类型，也不显示tips
            if (treeNode.MatchType !== MatchType.概念名称 && treeNode.MatchType !== MatchType.概念类型) {
                if (_.isNil(treeNode.parentTId) && treeNode.getIndex() === 0) {
                    aObj.addClass('hint--bottom');
                } else {
                    aObj.addClass('hint--top');
                }
                aObj.attr({
                    'aria-label': `${MatchType[treeNode.MatchType]}：${treeNode.MatchValue}`
                });
            }
        }
    }

    /**
     * Hover时添加DOM
     * @param treeId
     * @param treeNode
     */
    zTreeAddHoverDom(treeId, treeNode): void {
        //如果是外部的概念，没有任何权限
        if (treeNode.IsExternal) return;

        const aObj = $('#' + treeNode.tId + '_a');
        const checkLength = aObj.find('div[class="operationIco"]').length;
        if (checkLength == 0) {
            //得到操作Dom
            let $addElement = this.getConceptOperateDom(treeNode);
            if (!_.isNil($addElement)) {
                aObj.append($addElement);
                //点击事件
                aObj.off().on('click', 'span[flag="0"]', (event) => {
                    let action = parseInt($(event.target).attr('action'));
                    if (action === ConceptOperateType.取消删除) {
                        if (!this.authorizeInfo.P0_DeleteConcept) return;

                        this.modal.confirm()
                            .title('警告')
                            .message('确定要取消删除此概念吗？')
                            .okBtn('确定')
                            .cancelBtn('取消')
                            .size('sm')
                            .open()
                            .then(data => {
                                data.result.then(ret => {
                                    if (ret) {
                                        this.terminologyService.undoDeleteConcept(treeNode.id)
                                            .subscribe((rep) => {
                                                let tempRes = <server.DeletedStatusViewModel>rep;
                                                if (tempRes === undefined || tempRes === null) return;

                                                treeNode.DataStatus = tempRes.Status;
                                                //重新加载操作DOM
                                                aObj.find('div[class="operationIco"]').remove();
                                                let tempOptEle = this.getConceptOperateDom(treeNode);
                                                if (!_.isNil(tempOptEle)) {
                                                    aObj.append(tempOptEle);
                                                }
                                            });
                                    }
                                })
                                    .catch(() => { });
                            });
                    } else if (action === ConceptOperateType.删除) {
                        if (!this.authorizeInfo.P0_DeleteConcept) return;

                        this.modal.confirm()
                            .title('警告')
                            .message('确定要删除此概念吗？')
                            .okBtn('确定')
                            .cancelBtn('取消')
                            .size('sm')
                            .open()
                            .then(data => {
                                data.result.then(ret => {
                                    if (ret) {
                                        //删除
                                        this.terminologyService.deleteConcept(treeNode.id)
                                            .subscribe((rep) => {
                                                //此处rep为Response，需要json一下，base.service里对删除方法没有map
                                                let tempRes = <server.DeletedStatusViewModel>rep.json();
                                                if (tempRes === undefined || tempRes === null) return;

                                                if (tempRes.IsDeleted) {
                                                    this.zTreeObj.removeNode(treeNode, false);
                                                } else {
                                                    treeNode.DataStatus = tempRes.Status;
                                                    //重新加载操作DOM
                                                    aObj.find('div[class="operationIco"]').remove();
                                                    let tempOptEle = this.getConceptOperateDom(treeNode);
                                                    if (!_.isNil(tempOptEle)) {
                                                        aObj.append(tempOptEle);
                                                    }
                                                }
                                            });
                                    }
                                })
                                    .catch(() => { });;
                            });
                    } else {
                        if (!this.authorizeInfo.P0_AddConcept) return;

                        this.router.navigate([`/terminology/concept/${treeNode.id}/${action}`]);
                    }
                    event.stopPropagation();
                });
            }
        } else {
            aObj.find('div[class="operationIco"]').show();
        }
    }

    /**
     * 得到概念的操作按钮
     */
    getConceptOperateDom(treeNode) {
        let tempEle = '';

        if (this.authorizeInfo.P0_AddConcept
            && treeNode.DataStatus !== DataStatus.删除) {
            tempEle += `<span class="button add2-list" title="在下级新增概念" style="margin-left: 10px;" action="${ConceptOperateType.在下级新增概念}" flag="0"></span>
                   <span class="button add2" title="在同级新增概念" action="${ConceptOperateType.在同级新增概念}" flag="0"></span>`;
        }

        //删除状态下不允许编辑
        if (this.authorizeInfo.P0_ModifyConcept) {
            if (treeNode.DataStatus !== DataStatus.删除) {
                tempEle += `<span class="button edit" title="编辑" action="${ConceptOperateType.编辑}" flag="0"></span>`;
            }
        }

        if (this.authorizeInfo.P0_DeleteConcept) {
            if (treeNode.DataStatus === DataStatus.删除) {
                tempEle += `<span class="button remove" title="取消删除" action="${ConceptOperateType.取消删除}" flag="0"></span>`;
            } else {
                tempEle += `<span class="button remove" title="删除" action="${ConceptOperateType.删除}" flag="0"></span>`;
            }
        }

        return tempEle === '' ? null : $(`<div class="operationIco">${tempEle}</div>`);
    }

    /**
     * 离开时移除DOM
     * @param treeId
     * @param treeNode
     */
    zTreeRemoveHoverDom(treeId, treeNode): void {
        //layer.closeAll('tips');
        const aObj = $('#' + treeNode.tId + '_a');
        aObj.find('div[class="operationIco"]').hide();
    }

    /**
     * 树点击事件
     * @param event
     * @param treeId
     * @param treeNode
     */
    zTreeOnClick(event, treeId, treeNode): void {
        if (this.authorizeInfo.P0_ModifyConcept) {
            this.router.navigate([`/terminology/concept/${treeNode.id}/${ConceptOperateType.查看}`]);
        }
    }

    /**
     * 树展开事件
     * @param event
     * @param treeId
     * @param treeNode
     */
    zTreeOnExpland(event, treeId, treeNode) {
        //console.log('expland' + treeNode.isExpanded);
        if (!treeNode.isExpanded) {
            this.terminologyService.getConceptTreeData(treeNode.id)
                .subscribe((rep) => {
                    if (rep === null || rep === undefined || rep.length === 0) {
                        treeNode.isParent = false;
                    } else {
                        this.zTreeObj.addNodes(treeNode, rep, false);
                    }
                    treeNode.isExpanded = true;
                });
        };
    }

    /**
     * Drag前事件
     * @param treeId
     * @param treeNodes
     */
    zTreeBeforeDrag(treeId, treeNodes: Array<any>): boolean {
        return !(_.findIndex(treeNodes, (item) => {
            return item.IsExternal;
        }) > -1);
    }

    /**
     * Drop前事件
     * @param event
     * @param treeId
     * @param treeNodes
     * @param targetNode
     * @param moveType
     */
    zTreeBeforeDrop(event, treeId, treeNodes: Array<any>, targetNode, moveType): boolean {
        //如果targetNode === null，拖拽空白处，zTree认为是拖拽到根节点，应该禁止这种行为
        //目标节点如果是外部虚词表，不允许拖动
        //treeNodes如果包含外部变量，也不允许
        return !(_.isNil(targetNode) || targetNode.IsExternal || _.findIndex(treeNodes, (item) => {
            return item.IsExternal;
        }) > -1);
    }

    /**
     * 树拖拽事件
     * @param event
     * @param treeId
     * @param treeNodes
     * @param targetNode
     * @param moveType
     */
    zTreeOnDrop(event, treeId, treeNodes, targetNode, moveType): void {
        console.log('zTreeOnDrop');

        //targetNode是空白区域，直接返回
        if (targetNode === null) return;

        //console.log(moveType);
        //console.log(targetNode);
        //console.log(treeNodes);

        let dropNode = treeNodes[0];
        switch (moveType) {
            case 'inner':
                {
                    //console.log('inner' + targetNode.isExpanded);

                    //得到子，附加到节点上
                    if (!targetNode.isExpanded) {
                        //获取节点数据
                        this.terminologyService.getConceptTreeData(targetNode.id)
                            .subscribe((rep) => {
                                //附加targetNode子节点
                                if (rep === null || rep === undefined || rep.length === 0) {
                                    targetNode.isParent = false;
                                    dropNode.ConceptSort = 10;
                                    dropNode.PConceptID = targetNode.id;
                                } else {
                                    this.zTreeObj.addNodes(targetNode, rep, false);
                                    dropNode.ConceptSort = rep[0].ConceptSort / 2.0;
                                    dropNode.PConceptID = targetNode.id;
                                }
                                targetNode.isExpanded = true;

                                //展开到节点
                                this.zTreeObj.expandNode(targetNode, true, false, true, false);

                                this.saveConceptSort(dropNode.id, dropNode.ConceptSort, dropNode.PConceptID);
                            });
                    } else {
                        if (targetNode.children.length === 0) {
                            dropNode.ConceptSort = 10;
                            dropNode.PConceptID = targetNode.id;
                        } else {
                            dropNode.ConceptSort = targetNode.children[0].ConceptSort / 2.0;
                            dropNode.PConceptID = targetNode.id;
                        }
                        this.saveConceptSort(dropNode.id, dropNode.ConceptSort, dropNode.PConceptID);
                    }
                }; break;
            case 'prev':
            case 'next':
                {
                    let preNode = dropNode.getPreNode();
                    let nextNode = dropNode.getNextNode();

                    let tempSort: number;
                    if (preNode == null && nextNode != null) {
                        tempSort = nextNode.ConceptSort / 2.0;
                    } else if (preNode != null && nextNode == null) {
                        tempSort = preNode.ConceptSort + 1;
                    } else if (preNode != null && nextNode != null) {
                        tempSort = (preNode.ConceptSort + nextNode.ConceptSort) / 2.0;
                    } else {
                        tempSort = 10;
                    }

                    dropNode.ConceptSort = tempSort;
                    dropNode.PConceptID = targetNode.PConceptID;

                    this.saveConceptSort(dropNode.id, dropNode.ConceptSort, dropNode.PConceptID);
                }; break;
        }
    }

    /**
     * 搜索概念
     * @param filter
     */
    searchConcept(filter: string): void {
        this.searchTerms.next(filter);
    }

    /**
     * 概念树拖动保存
     * @param conceptId
     * @param conceptSort
     * @param conceptParentId
     */
    saveConceptSort(conceptId: string, conceptSort: number, conceptParentId: string): void {
        this.terminologyService.updateConceptSort(conceptId, conceptSort, conceptParentId).subscribe();
    }

    ok() {
        this.modal.alert()
            .title('提示')
            .message('修改成功！')
            .okBtn('确定')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.location.back();
                    }
                });
            });
    }

    cancel() {
        this.location.back();
    }
}