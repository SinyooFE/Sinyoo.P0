/**
* 变量编辑组件
*/
import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Overlay, overlayConfigFactory, DialogRef, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { VariableLogComponent, VariableLogContext } from './variable-log.component';
import { VariableEditorTerminologyComponent, VariableEditorTerminologyContext } from './variable-editor-terminology.component';

import { TerminologyService, StandardService,BaseService } from '../../services';

import { FieldCannotEnumOptions, TabFunctionModel } from '../../models';
import {
    ApprovalStatus, AttributeType, ConceptDislpayList, FieldCoreCategory,
    FieldCoreCategoryEn, FieldRole, FieldRoleEn, FieldDataType, FieldType,
    FieldStatisticType, FieldIsPrivate, FieldDataLevel, FieldControlType,
    FieldControlTermFormat, FieldOptionType
} from 'crabyter-p0-server/Enum';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class VariableEditorContext extends BSModalContext {
    isAdd: boolean;
    standardId: number;//其实可以不要
    domainId: number;//其实可以不要
    variableId: number;

}

@Component({
    // moduleId: module.id,
    selector: 'variable-editor',
    styleUrls: ['variable-editor.component.css'],
    templateUrl: 'variable-editor.component.html'
})

export class VariableEditorComponent implements CloseGuard, OnInit, AfterViewInit {
    variableDetail = <server.S_FieldDetailViewModel>{};
    checkVariableDetail = <server.S_FieldDetailViewModel>{};
    private context: VariableEditorContext;

    //无法枚举的值
    fieldCannotEnumOptions = new FieldCannotEnumOptions();

    //选项返回值下拉选择
    conceptTypeAttributes: Array<server.T_ConceptTypeAttributeViewModel> = [];

    //tab菜单
    currentEditorTab: TabFunctionModel;
    variableEditorTab: TabFunctionModel[] = [];

    //枚举
    enumApprovalStatus = ApprovalStatus;
    enumConceptDislpayList = ConceptDislpayList;
    enumFieldCoreCategory = FieldCoreCategory;
    enumFieldCoreCategoryEn = FieldCoreCategoryEn;
    enumFieldRole = FieldRole;
    enumFieldRoleEn = FieldRoleEn;
    enumFieldDataType = FieldDataType;
    enumFieldType = FieldType;
    enumFieldStatisticType = FieldStatisticType;
    enumFieldIsPrivate = FieldIsPrivate;
    enumFieldDataLevel = FieldDataLevel;
    enumFieldControlType = FieldControlType;
    enumFieldControlTermFormat = FieldControlTermFormat;
    enumFieldOptionType = FieldOptionType;

    //编辑区域高度
    editorHeight = 0;

    //
    isShowAttribute = false;

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private route: ActivatedRoute,
        private location: Location,
        private baseService: BaseService,
        private standardService: StandardService,
        private terminologyService: TerminologyService,
        public modal: Modal) {
        overlay.defaultViewContainer = vcRef;

        this.route.params.subscribe(
            params => {
                this.context = <VariableEditorContext>{
                    isAdd: params['variableid'] == 0,
                    domainId: +params['domainid'],
                    standardId: +params['standardid'],
                    variableId: +params['variableid']
                };
                this.initialData();
            }
        );

        this.variableEditorTab.push(new TabFunctionModel('basic', '基本设置'));
        this.variableEditorTab.push(new TabFunctionModel('option', '选项设置'));
        this.variableEditorTab.push(new TabFunctionModel('synonym', '同义词设置'));
        this.currentEditorTab = this.variableEditorTab[0];
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 150;
                if (!this.context.isAdd) {
                    this.editorHeight = this.editorHeight - (this.isShowAttribute ? 236 : 100);
                }
            });
    }

    initialData(): void {
        if (this.context.isAdd) {
            this.variableDetail = <server.S_FieldDetailViewModel>{
                ID: 0,
                DomainID: this.context.domainId,
                Options: [],
                SynonymFields: []
            };
            this.checkVariableDetail = _.cloneDeep(this.variableDetail);
        } else {
            this.standardService.getVairableDetail(
                this.context.standardId, this.context.domainId, this.context.variableId)
                .subscribe(
                (data) => {
                    this.variableDetail = data;
                    this.checkVariableDetail = _.cloneDeep(this.variableDetail);
                    this.setConceptTypeAttributes();
                });
        }
    }

    /**
     * 切换tab页
     * @param item
     */
    changSelectedTab(tab: TabFunctionModel): void {
        if (!$('.variableSetting form')[0].checkValidity()) {
            let checkRes = '';
            switch (this.currentEditorTab.key) {
                case 'basic':
                    checkRes = '请先完善基本设置信息！'; break;
                case 'option':
                    checkRes = '请先完善选项信息！'; break;
                case 'synonym':
                    checkRes = '请先完善同义词信息！'; break;
            }
            if (checkRes !== '') {
                this.modal.alert()
                    .title('提示')
                    .message(checkRes)
                    .okBtn('确定')
                    .size('sm')
                    .open();
                return;
            }
        }
        this.currentEditorTab = tab;
    }

    showStandardLog() {
        this.modal.open(VariableLogComponent,
            overlayConfigFactory({
                standardId: this.context.standardId,
                domainId: this.context.domainId,
                variableId: this.variableDetail.ID,
                variableName: this.variableDetail.FieldName
            },
                BSModalContext));
    }

    /**
     * 删除变量同义词
     * @param id
     */
    deleteSynonym(synonymIndex: number) {
        _.remove(this.variableDetail.SynonymFields,
            (item, index) => {
                return synonymIndex === index;
            });
    }

    /**
     * 添加变量同义词
     */
    addSynonym() {
        if (!this.checkSynonym()) {
            this.modal.alert()
                .title('提示')
                .message('同义词名称不能为空！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.variableDetail.SynonymFields.push(
            <server.S_SynonymFieldViewModel>{
                ID: 0,
                FieldID: this.variableDetail.ID,
                IsDeleted: false,
                Sort: 1,
                SynonymFieldName: ''
            });
    }

    /**
     * 检查同义词是否合法
     * 不能为空
     * 通过true,否则false
     */
    checkSynonym() {
        let tempSynonym = _.find(this.variableDetail.SynonymFields,
            (item) => {
                return _.isNil(item.SynonymFieldName) || item.SynonymFieldName === '';
            });
        return _.isNil(tempSynonym);
    }

    selectFromTerminology(): void {
        this.modal
            .open(VariableEditorTerminologyComponent, overlayConfigFactory({
                fieldId: this.variableDetail.ID,
                optionType: FieldOptionType.静态概念,
                fieldOptions: this.variableDetail.Options,
                conceptTypeId: this.variableDetail.ConceptTypeID,
                conceptTypeName: this.variableDetail.ConceptTypeName
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        console.log(ret.model);
                        if (ret.model !== undefined && ret.model !== null) {
                            //ConceptTypeID为空时填入
                            if (this.variableDetail.ConceptTypeID === undefined ||
                                this.variableDetail.ConceptTypeID === null ||
                                this.variableDetail.ConceptTypeID === '') {
                                this.variableDetail.ConceptTypeID = ret.conceptTypeId;
                                this.variableDetail.ConceptTypeName = ret.conceptTypeName;
                                //设置概念类型属性
                                this.setConceptTypeAttributes();
                            }
                            this.variableDetail.Options = this.variableDetail.Options.concat(ret.model);
                        }
                    }
                }).catch(() => { });
            });
    }

    /**
     * 删除选项
     * @param optionIndex
     */
    deleteOption(optionIndex: number): void {
        _.remove(this.variableDetail.Options, (item, index) => {
            return index === optionIndex;
        });
        //如果长度为零，需要清空
        if (this.variableDetail.Options.length === 0) {
            this.variableDetail.ConceptTypeID = '';
            this.variableDetail.ConceptTypeName = '';
            //清空属性
            this.conceptTypeAttributes = [];
        }
    }

    /**
     * 设置下拉
     */
    setConceptTypeAttributes(): void {
        if (this.variableDetail.ConceptTypeID !== undefined &&
            this.variableDetail.ConceptTypeID !== null &&
            this.variableDetail.ConceptTypeID !== '') {
            this.terminologyService.getConceptTypeAttributesForStandard(this.variableDetail.ConceptTypeID)
                .subscribe((data) => {
                    this.conceptTypeAttributes = data;
                });
        }
    }

    /**
     * 是否关系属性
     */
    checkIsRelatedAttribute(): boolean {
        let tempAttr = _.find(this.conceptTypeAttributes, (item) => {
            return item.AttributeID === this.variableDetail.ReturnValue;
        });

        if (tempAttr === undefined || tempAttr === null) {
            return false;
        } else {
            return tempAttr.AttributeType === AttributeType.关系属性;
        }
    }

    /**
     * 检查是否更新
     */
    checkIsModify(): boolean {
        return !_.isEqual(this.variableDetail, this.checkVariableDetail);
    }

    /**
     * 显示基本信息
     */
    toggleBasicInfo() {
        this.isShowAttribute = !this.isShowAttribute;
        this.editorHeight = this.editorHeight - (this.isShowAttribute ? 136 : -136);
    }

    ok() {
        //如果未修改，提示不需要保存
        if (!this.checkIsModify()) {
            this.modal.alert()
                .title('提示')
                .message('您未做任何修改，不需要保存！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        if (!this.checkSynonym()) {
            this.modal.alert()
                .title('提示')
                .message('同义词名称不能为空！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.standardService.saveVariableDetail(this.context.standardId, this.context.domainId, this.variableDetail)
            .subscribe(
            (data) => {
                if (this.context.isAdd) {
                    this.modal.confirm()
                        .title('警告')
                        .message('添加成功！是否继续添加？')
                        .okBtn('确定')
                        .cancelBtn('取消')
                        .size('sm')
                        .open().then(data => {
                            data.result.then(ret => {
                                if (ret) {
                                    this.initialData();
                                    this.currentEditorTab = this.variableEditorTab[0];
                                }
                            }).catch(() => {
                                this.location.back();
                            });
                        });
                } else {
                    this.modal.alert()
                        .title('警告')
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
            });
    }

    cancel() {
        this.location.back();
    }


}