/**
* 术语选择器
*/
import { Component, AfterViewInit, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { Overlay, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService, StandardService } from '../../services';

import { FieldOptionType } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class VariableEditorTerminologyContext extends BSModalContext {
    fieldId: number;
    optionType: FieldOptionType;
    fieldOptions: Array<server.S_OptionViewModel>;
    //conceptId对应的概念类型Id
    conceptTypeId: string;
    conceptTypeName: string;
}

@Component({
    // moduleId: module.id,
    selector: 'variable-editor-terminology',
    styleUrls: ['variable-editor-terminology.component.css'],
    templateUrl: 'variable-editor-terminology.component.html'
})

export class VariableEditorTerminologyComponent implements CloseGuard, OnInit, AfterViewInit, ModalComponent<VariableEditorTerminologyContext>  {
    context: VariableEditorTerminologyContext;

    //勾选的概念对应生成的选项
    checkedConcepyOptions: Array<server.S_OptionViewModel> = [];

    //checkedConceptName
    checkedConceptName = '';

    //是否选择父概念
    isCheckParent = false;

    //概念树相关
    conceptTreeId = 'variableEditorConceptTree';
    zTreeObj: any;

    //枚举
    enumFieldOptionType = FieldOptionType;

    //下拉框
    @ViewChild('dropDownTrigger') dropDownTrigger;

    constructor(public dialog: DialogRef<VariableEditorTerminologyContext>,
        private terminologyService: TerminologyService,
        private standardService: StandardService,
        private modal: Modal) {

        dialog.context.size = 'sm';
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = dialog.context;

        this.initData();
    }

    /**
     * 初始化数据
     */
    initData(): void {
        if (this.context.conceptTypeId === undefined || this.context.conceptTypeId === null) {
            this.context.conceptTypeId = '';
        }
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.setConceptTree();

        //下拉框
        if (this.dropDownTrigger != null) {
            let eventTarget = $(this.dropDownTrigger.nativeElement);
            eventTarget.on({
                click: (event) => {
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
                    event.stopPropagation();
                }
            });
        }
    }

    /**
     * 设置概念树
     */
    setConceptTree(): void {
        this.terminologyService.getApprovedConceptTreeData()
            .subscribe((rep) => {
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
                    check: {
                        enable: true,
                        chkboxType: { "Y": '', "N": '' }
                    },
                    callback: {
                        onExpand: (event, treeId, treeNode) => {
                            if (!treeNode.isExpanded) {
                                this.terminologyService.getApprovedConceptTreeData(treeNode.id)
                                    .subscribe((rep) => {
                                        if (rep === null || rep === undefined || rep.length === 0) {
                                            treeNode.isParent = false;
                                        } else {
                                            this.zTreeObj.addNodes(treeNode, rep, false);
                                        }
                                        treeNode.isExpanded = true;
                                    });
                            }
                        },
                        onClick: (event, treeId, treeNode) => {
                            this.zTreeObj.checkNode(treeNode, !treeNode.checked, false, true);
                        },
                        beforeCheck: (treeId, treeNode) => {
                            console.log(this.context.conceptTypeId);
                            console.log(treeNode.ConceptTypeID);

                            //节点概念类型判断
                            if (treeNode.ConceptTypeID === undefined ||
                                treeNode.ConceptTypeID === null ||
                                treeNode.ConceptTypeID === '') {
                                this.showAlert('未找到此概念的类型信息！');
                                return false;
                            }

                            //已选概念限制
                            if (_.findIndex(this.context.fieldOptions,
                                (item) => { return item.ConceptID === treeNode.id; }) >
                                -1) {
                                this.showAlert('此概念已存在，不能重复添加！');
                                return false;
                            }

                            //概念类型条件限制
                            if (this.context.conceptTypeId === '' || treeNode.ConceptTypeID === this.context.conceptTypeId) {
                                return true;
                            } else {
                                this.showAlert('只能选择具有相同概念类型的概念！');
                                return false;
                            }
                        },
                        onCheck: (event, treeId, treeNode) => {
                            this.setCheckedConceptName(event, treeId, treeNode);
                        }
                    }
                };
                $.fn.zTree.init($(`#${this.conceptTreeId}`), setting, rep);
                this.zTreeObj = $.fn.zTree.getZTreeObj(this.conceptTreeId);
            });
    }

    setCheckedConceptName(event, treeId, treeNode): void {
        console.log(treeNode.checked);
        if (this.zTreeObj != null) {
            if (treeNode.checked) {
                //设置conceptTypeId
                if (this.checkedConcepyOptions.length === 0) {
                    this.context.conceptTypeId = treeNode.ConceptTypeID;
                    this.context.conceptTypeName = treeNode.name;
                }
                //加入checkedConcepyOptions
                this.checkedConcepyOptions.push(<server.S_OptionViewModel>{
                    FieldID: this.context.fieldId,
                    OptionType: this.context.optionType,
                    ConceptID: treeNode.id,
                    ReturnValue: '',
                    OptionValue: treeNode.name,
                    OptionValueEn: treeNode.ConceptNameEn,
                    HasParent: this.isCheckParent
                });
            } else {
                //移除checkedConcepyOptions
                _.remove(this.checkedConcepyOptions, (item) => {
                    return item.ConceptID === treeNode.id;
                });
                //设置conceptTypeId
                if (this.checkedConcepyOptions.length === 0) {
                    this.context.conceptTypeId = '';
                    this.context.conceptTypeName = '';
                }
            }

            //设置选择的概念的中文名称
            let tempName = '';
            this.checkedConcepyOptions.forEach((item) => {
                tempName += `${item.OptionValue},`;
            });
            this.checkedConceptName = _.trimEnd(tempName, ',');
        }
    }

    /**
     * 改变类型
     * @param optionType
     */
    changeOptionType(optionType): void {
        this.context.optionType = +optionType;
        this.checkedConcepyOptions.forEach((item) => {
            item.OptionType = this.context.optionType;
        });
    }

    onclose(ok: boolean) {
        this.dialog.close({ IsOk: ok });
    }

    beforeDismiss(): boolean {
        return false;
    }

    beforeClose(): boolean {
        return false;
    }

    /**
     * 保存标准
     */
    ok() {
        if (this.checkedConcepyOptions.length === 0) {
            this.showAlert('至少选择一个概念！', 1);
            return;
        }

        this.dialog.close({
            IsOk: true,
            model: this.checkedConcepyOptions,
            conceptTypeId: this.context.conceptTypeId,
            conceptTypeName: this.context.conceptTypeName
        });
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
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