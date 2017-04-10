import { Component, AfterViewInit, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { Overlay, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import * as server from '../../models/server';

import _ from 'lodash';

export class ConceptTreeTypeSelectContext extends BSModalContext {
    conceptTypeData: any;
    selectedConceptType: Array<string>;
}

@Component({
    // moduleId: module.id,
    selector: 'concept-tree-typeselect',
    styleUrls: ['concept-tree-typeselect.component.css'],
    templateUrl: 'concept-tree-typeselect.component.html'
})

export class ConceptTreeTypeSelectComponent implements CloseGuard, OnInit, AfterViewInit, ModalComponent<ConceptTreeTypeSelectContext>  {
    context: ConceptTreeTypeSelectContext;
    //概念类型树相关
    conceptTypeTreeId = 'conceptTypeTreeId';
    zTreeTypeObj: any;

    constructor(public dialog: DialogRef<ConceptTreeTypeSelectContext>,
        private terminologyService: TerminologyService,
        private modal: Modal) {

        dialog.context.size = 'sm';
        dialog.context.inElement = true;
        dialog.context.isBlocking = false;
        //dialog.setCloseGuard(this);
        this.context = dialog.context;
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.initTree();
    }

    /**
     * 初始化数据
     */
    initTree(): void {
        //初始化树
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
            }
        };
        this.zTreeTypeObj = $.fn.zTree.init($(`#${this.conceptTypeTreeId}`), setting, this.context.conceptTypeData);
        console.log(this.zTreeTypeObj);
        if (this.context.selectedConceptType.length > 0) {
            _.each(this.context.selectedConceptType, (typeId) => {
                let tempNode = this.zTreeTypeObj.getNodeByParam('id', typeId, null);
                if (!_.isNil(tempNode)) {
                    this.zTreeTypeObj.checkNode(tempNode, true, true);
                }
            });
        }
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
        this.dialog.close({ IsOk: true, SelectedType: _.map(this.zTreeTypeObj.getCheckedNodes(true), 'id') });
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