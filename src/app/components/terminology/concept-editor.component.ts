import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Overlay, overlayConfigFactory, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { ConceptLogComponent } from '../../components/terminology/concept-log.component';
import { ConceptAttributeComponent, ConceptAttributeContext } from '../../components/terminology/concept-attribute.component';
import { ConceptSynonymComponent, ConceptSynonymContext } from '../../components/terminology/concept-synonym.component';

import { QueryAuthorizeInfo, AuthorizeInfo, TerminologyService, BaseService } from '../../services';

import { ConceptOperateType, ApprovalStatus, SynonymType, DataStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptEditorContext {
    isAdd: boolean;
    operateType: ConceptOperateType;
    conceptId: string;

    isView: boolean;
    selectedDetail: server.T_ConceptDetailViewModel;
    currentDetail: server.T_ConceptDetailViewModel;
}

@Component({
    // moduleId: module.id,
    selector: 'concept-editor',
    styleUrls: ['concept-editor.component.css'],
    templateUrl: 'concept-editor.component.html'
})

export class ConceptEditorComponent implements CloseGuard, OnInit, AfterViewInit {
    private context: ConceptEditorContext;

    @ViewChild('dropDownTrigger') dropDownTrigger;
    private conceptTypeTreeId = 'conceptEditorConceptTypeTree';
    private zTreeTypeObj = null;

    //枚举
    enumConceptOperateType = ConceptOperateType;
    enumApprovalStatus = ApprovalStatus;
    enumSynonymType = SynonymType;
    enumDataStatus = DataStatus;
    //权限
    authorizeInfo = new AuthorizeInfo();

    //编辑区域高度
    editorHeight = 0;

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private route: ActivatedRoute,
        private location: Location,
        private terminologyService: TerminologyService,
        private queryAuthorizeInfo: QueryAuthorizeInfo,
        private baseService: BaseService,
        public modal: Modal) {

        overlay.defaultViewContainer = vcRef;

        this.route.params.subscribe(
            params => {
                //console.log(params);
                if (!_.isNil(params['conceptoperate'])) {
                    this.context = <ConceptEditorContext>{
                        isAdd: false,
                        operateType: +params['conceptoperate'],
                        conceptId: params['conceptid']
                    };
                } else {
                    this.context = <ConceptEditorContext>{
                        isAdd: true,
                        operateType: ConceptOperateType.新增,
                        conceptId: ''
                    };
                }
                this.initData();
            }
        );
    }

    ngOnInit(): void {
        console.log('summernote');
        //权限
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.authorizeInfo = <AuthorizeInfo>auth;

            //一些权限判断，避免修改地址地址栏出现意外的结果
            let checkRes = '';
            switch (this.context.operateType) {
                case ConceptOperateType.查看:
                case ConceptOperateType.编辑:
                    {
                        if (!this.authorizeInfo.P0_ModifyConcept) {
                            checkRes = '您没有此概念的编辑权限！';
                        }
                    };
                    break;
                case ConceptOperateType.在下级新增概念:
                case ConceptOperateType.在同级新增概念:
                    {
                        if (!this.authorizeInfo.P0_AddConcept) {
                            checkRes = '您没有添加概念的权限！';
                        }
                    };
                    break;
            }

            if (checkRes !== '') {
                this.context = <ConceptEditorContext>{
                    isAdd: true,
                    operateType: ConceptOperateType.新增,
                    conceptId: ''
                };

                this.modal.alert()
                    .title('警告')
                    .message(checkRes)
                    .okBtn('确定')
                    .size('sm')
                    .open();
            }
        });
        //编辑器
        $(".summernote").summernote({
            lang: 'zh-CN',
            minHeight: '250px'
        });
        //概念类型树
        this.initConceptTypeTree();
    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 170;
            });

        if (this.dropDownTrigger != null) {
            let eventTarget = $(this.dropDownTrigger.nativeElement);
            eventTarget.on({
                click: (event) => {
                    if (!this.context.isView) {
                        if (eventTarget.parent().hasClass('open')) {
                            eventTarget.find('i').html('&#xe6b6;');
                            eventTarget.parent().removeClass('open');
                            $('body').off('click.dropdown');
                        } else {
                            eventTarget.find('i').html('&#xe65d;');
                            eventTarget.parent().addClass('open');

                            $('body').on('click.dropdown', (e) => {
                                if (!eventTarget.next('div').is(e.target)
                                    && eventTarget.next('div').has(e.target).length === 0
                                    && eventTarget.parent().has(e.target).length === 0) {
                                    eventTarget.find('i').html('&#xe6b6;');
                                    eventTarget.parent().removeClass('open');
                                    $('body').off('click.dropdown');
                                }
                            });
                        }
                    }
                    event.stopPropagation();
                }
            });
        }
    }

    /**
     * 初始化一些必要信息
     */
    initData(): void {
        this.context.isView = (this.context.operateType === ConceptOperateType.查看);
        this.context.selectedDetail = <server.T_ConceptDetailViewModel>{ Attributes: [], Synonymes: [], ConceptDefinition: '' };
        this.context.currentDetail = <server.T_ConceptDetailViewModel>{ Attributes: [], Synonymes: [], ConceptDefinition: '' };

        if (!this.context.isAdd) {
            this.getParentConceptIdPromise()
                .then((conceptId: string) => {
                    if (!_.isNil(conceptId) && conceptId !== '') {
                        this.terminologyService.getConcept(conceptId)
                            .subscribe((res) => {
                                this.context.selectedDetail = res;
                                this.loadTemplateData();
                            });
                    } else {
                        this.loadTemplateData();
                    }
                });
        }
    }

    /**
     * 获取父级概念Id
     */
    getParentConceptIdPromise(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.context.operateType === ConceptOperateType.在同级新增概念) {
                this.terminologyService.getConcept(this.context.conceptId)
                    .subscribe(
                    (data) => {
                        resolve(data.PConceptID);
                    },
                    (error) => {
                        reject('');
                    });
            } else {
                resolve(this.context.conceptId);
            }
        });
    }

    /**
     * 设置context.selectedDetail后，初始化数据
     */
    loadTemplateData() {
        this.initCurrentConceptDetail();
        //设置富文本框的值
        let text = this.context.currentDetail === undefined
            ? ''
            : this.context.currentDetail.ConceptDefinition;
        $(".summernote").summernote('reset');
        $(".summernote").summernote('code', text);

        //设置能否编辑
        if (this.context.isView) {
            $(".summernote").summernote('disable');
        } else {
            $(".summernote").summernote('enable');
        }
    }

    /**
     * 初始化绑定页面数据
     */
    initCurrentConceptDetail(): void {
        //如果是外部概念，只允许查看
        if (this.context.selectedDetail.IsExternal && this.context.operateType !== ConceptOperateType.查看) {
            this.context.operateType = ConceptOperateType.查看;
            this.context.isView = true;

            this.modal.alert()
                .title('警告')
                .message('外部概念只能查看！')
                .okBtn('确定')
                .size('sm')
                .open();
        }
        this.context.currentDetail = <server.T_ConceptDetailViewModel>{ Attributes: [], Synonymes: [], ConceptDefinition: '' };
        switch (this.context.operateType) {
            case ConceptOperateType.在同级新增概念:
            case ConceptOperateType.在下级新增概念:
                {
                    this.context.currentDetail.PConceptID = this.context.selectedDetail.ConceptID;
                    this.context.currentDetail.ConceptTypeID = this.context.selectedDetail.ConceptTypeID;
                    this.context.currentDetail.ConceptTypeName = this.context.selectedDetail.ConceptTypeName;
                    this.context.currentDetail.Attributes = _.map(this.context.selectedDetail.Attributes, (item) => {
                        item.AttributeID = '';
                        item.AttributeValue = '';
                        item.ConceptID = '';
                        return item;
                    });
                }; break;
            case ConceptOperateType.编辑:
            case ConceptOperateType.查看:
                {
                    this.context.currentDetail = _.cloneDeep(this.context.selectedDetail);
                }; break;
            default:
                {
                    this.context.operateType = ConceptOperateType.新增;
                }; break;
        }
    }

    /**
     * 初始化概念类型树选择
     * @param isExpland
     */
    initConceptTypeTree(): void {
        if (this.zTreeTypeObj == null) {
            //初始化树
            this.terminologyService.getConceptTypes()
                .subscribe((data) => {
                    let setting = {
                        view: {
                            showLine: false,
                            showIcon: false
                        },
                        edit: {
                            isMove: false,
                            enable: false,
                            showRemoveBtn: false,
                            showRenameBtn: false
                        },
                        callback: {
                            onClick: (event, treeId, treeNode) => {
                                if (this.context.currentDetail.Attributes.length > 0) {
                                    this.modal.confirm()
                                        .title('警告')
                                        .message('此操作将丢失已有属性，确定要执行吗？')
                                        .okBtn('确定')
                                        .cancelBtn('取消')
                                        .size('sm')
                                        .open().then(data => {
                                            data.result.then(ret => {
                                                if (ret) {
                                                    this.loadConceptTypeAttributes(treeNode);
                                                }
                                            }).catch(() => { });
                                        });
                                } else {
                                    this.loadConceptTypeAttributes(treeNode);
                                }
                            }
                        }
                    };
                    $.fn.zTree.init($(`#${this.conceptTypeTreeId}`), setting, data);
                    this.zTreeTypeObj = $.fn.zTree.getZTreeObj(this.conceptTypeTreeId);
                });
        }
    }

    /**
     * 加载概念类型属性列表
     * @param treeNode
     */
    loadConceptTypeAttributes(treeNode): void {
        this.context.currentDetail.ConceptTypeName = treeNode.name;
        this.context.currentDetail.ConceptTypeID = treeNode.id;
        //获取概念类型下的所有属性
        this.terminologyService.getConceptTypeAttributes(treeNode.id)
            .subscribe((rep) => {
                //先清空再赋值
                this.context.currentDetail.Attributes = [];

                _.forEach(rep,
                    (item) => {
                        this.context.currentDetail.Attributes.push(<server.T_AttributeViewModel>{
                            ConceptID: this.context.currentDetail.ConceptID,
                            AttributeID: '',
                            ConceptTypeAttrID: item.AttributeID,
                            ConceptTypeAttribute: item,
                            AttributeName: item.AttributeName,
                            AttributeType: item.AttributeType,
                            AttributeValue: '',
                            ControlType: item.ControlType,
                            OptionItems: item.OptionItems,
                            IsMulti: item.IsMulti,
                            RelatedConceptIDs: [],
                            AttributeSort: 0
                        });
                    });
            });

        //关闭弹出层
        let eventTarget = $(this.dropDownTrigger.nativeElement);
        eventTarget.find('i').html('&#xe6b6;');
        eventTarget.parent().removeClass('open');
        $('body').off('click.dropdown');
    }

    /**
     * 拼音
     * @param value
     */
    setPinyin(value: string): void {
        this.context.currentDetail.ConceptNamePy = pinyinUtil.getFirstLetter(value);
    }

    /**
     * 日志
     */
    loadConceptLog(): void {
        this.modal.open(ConceptLogComponent, overlayConfigFactory({
            conceptId: this.context.currentDetail.ConceptID,
            conceptName: this.context.currentDetail.ConceptName
        }, BSModalContext));
    }

    /**
     * 属性操作
     * @param index
     */
    operateConceptAttribute(index: number): void {
        this.modal.open(ConceptAttributeComponent, overlayConfigFactory(<ConceptAttributeContext>{
            curIndex: index,
            attributes: this.context.currentDetail.Attributes
        }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            if (ret.index > -1 && ret.index < this.context.currentDetail.Attributes.length) {
                                this.context.currentDetail.Attributes[ret.index] = ret.model;
                            }
                        }
                    }
                });
            });
    }

    /**
     * 同义词操作
     * @param isAdd
     * @param synonymType
     * @param synonymIndex
     */
    operateConceptSynonym(isAdd: boolean, synonymType: SynonymType, synonymIndex: number = -1, isDelete = false): void {
        if (isDelete) {
            _.remove(this.context.currentDetail.Synonymes,
                (item, index) => {
                    return index === synonymIndex;
                });
            return;
        }

        this.modal.open(ConceptSynonymComponent,
            overlayConfigFactory(<ConceptSynonymContext>{
                isAdd: isAdd,
                synonymType: synonymType,
                synonyms: this.context.currentDetail.Synonymes,
                conceptId: this.context.currentDetail.ConceptID,
                conceptName: this.context.currentDetail.ConceptName,
                curIndex: synonymIndex
            }, BSModalContext)).then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            if (isAdd) {
                                this.context.currentDetail.Synonymes.push(<server.T_SynonymDetailViewModel>ret.model);
                            } else {
                                if (ret.index > -1 && ret.index < this.context.currentDetail.Synonymes.length) {
                                    this.context.currentDetail.Synonymes[ret.index] = ret.model;
                                }
                            }
                        }
                    }
                }).catch(() => { });
            });
    }

    /**
     * 保存
     */
    ok(): void {
        //如果未修改，提示不需要保存
        if (!this.checkIsModify()) {
            this.showAlert('您未做任何修改，不需要保存！');
            return;
        }

        //概念类型判断
        if (this.context.currentDetail.ConceptTypeID === undefined
            || this.context.currentDetail.ConceptTypeID === null
            || this.context.currentDetail.ConceptTypeID === '') {
            this.showAlert('请选择概念类型！', 1);
            return;
        }

        //富文本内容
        this.context.currentDetail.ConceptDefinition = $(".summernote").summernote('code').trim();

        console.log(this.context);

        if (this.context.currentDetail.ConceptID === undefined
            || this.context.currentDetail.ConceptID === null
            || this.context.currentDetail.ConceptID === '') {
            if (!this.authorizeInfo.P0_AddConcept) return;

            this.terminologyService.addConcept(this.context.currentDetail)
                .subscribe((rep) => {
                    this.terminologyService.reportConceptDetail.emit({
                        action: ConceptOperateType.添加树节点,
                        detail: rep
                    });

                    this.loadTemplateData();
                    this.showAlert('添加成功！');
                });
        } else {
            if (!this.authorizeInfo.P0_ModifyConcept) return;

            this.terminologyService.updateConcept(this.context.currentDetail.ConceptID, this.context.currentDetail)
                .subscribe((rep) => {
                    this.terminologyService.reportConceptDetail.emit({
                        action: ConceptOperateType.修改树节点,
                        detail: rep
                    });

                    this.context.selectedDetail = rep;
                    this.loadTemplateData();
                    this.showAlert('修改成功！');
                });
        }
    }

    cancel() {
        this.location.back();
    }

    /**
     * 删除概念
     */
    deleteConcept(): void {
        if (!this.authorizeInfo.P0_DeleteConcept) return;

        //验证待写
        this.modal.confirm()
            .title('警告')
            .message('确定要删除吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.terminologyService.deleteConcept(this.context.currentDetail.ConceptID)
                            .subscribe((rep) => {
                                let tempRes = <server.DeletedStatusViewModel>rep;
                                if (tempRes === undefined || tempRes === null) return;

                                this.context.currentDetail.DataStatus = tempRes.Status;
                                if (tempRes.IsDeleted) {
                                    this.terminologyService.reportConceptDetail.emit({
                                        action: ConceptOperateType.删除树节点,
                                        detail: this.context.currentDetail
                                    });
                                } else {
                                    this.terminologyService.reportConceptDetail.emit({
                                        action: ConceptOperateType.修改树节点,
                                        detail: this.context.currentDetail
                                    });
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 取消删除
     */
    cancelDeleteConcept(): void {
        if (!this.authorizeInfo.P0_DeleteConcept) return;

        //验证待写
        this.modal.confirm()
            .title('警告')
            .message('确定要取消删除吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.terminologyService.undoDeleteConcept(this.context.currentDetail.ConceptID)
                            .subscribe((rep) => {
                                let tempRes = <server.DeletedStatusViewModel>rep;
                                if (tempRes === undefined || tempRes === null) return;

                                this.context.currentDetail.DataStatus = tempRes.Status;
                                this.terminologyService.reportConceptDetail.emit({
                                    action: ConceptOperateType.修改树节点,
                                    detail: this.context.currentDetail
                                });
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 判断是否有修改
     */
    checkIsModify(): boolean {
        //查看状态直接退出
        if (this.context.isView) return false;

        let checkDetail = <server.T_ConceptDetailViewModel>{ Attributes: [], Synonymes: [], ConceptDefinition: '' };
        switch (this.context.operateType) {
            case ConceptOperateType.在同级新增概念:
            case ConceptOperateType.在下级新增概念:
                {
                    checkDetail.PConceptID = this.context.selectedDetail.ConceptID;
                    checkDetail.ConceptTypeID = this.context.selectedDetail.ConceptTypeID;
                    checkDetail.ConceptTypeName = this.context.selectedDetail.ConceptTypeName;
                    checkDetail.Attributes = _.map(this.context.selectedDetail.Attributes, (item) => {
                        item.AttributeID = '';
                        item.AttributeValue = '';
                        item.ConceptID = '';
                        return item;
                    });
                }; break;
            case ConceptOperateType.编辑:
                {
                    checkDetail = _.cloneDeep(this.context.selectedDetail);
                }; break;
        }
        //富文本内容
        checkDetail.ConceptDefinition = $(".summernote").summernote('code').trim();
        //console.log(checkDetail);
        //console.log(this.context.currentDetail);
        return !_.isEqual(checkDetail, this.context.currentDetail);
    }

    /**
     * 检查离开时是否需要保存
     */
    checkLeave(): Promise<boolean> | boolean {
        console.log('checkLeave');
        if (this.checkIsModify()) {
            console.log('有修改');
            return new Promise<Boolean>((resolve, reject) => {
                this.modal.confirm()
                    .title('警告')
                    .message('您有未保存的修改，确定离开吗？')
                    .okBtn('确定')
                    .cancelBtn('取消')
                    .size('sm')
                    .open()
                    .then(data => {
                        data.result.then(ret => {
                            resolve(ret);
                        }).catch(() => {
                            resolve(false);
                        });
                    });
            });
        } else {
            return true;
        }
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