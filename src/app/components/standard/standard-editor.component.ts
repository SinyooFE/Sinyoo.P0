/**
* 组件编辑(新增)组件
*/
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { StandardService } from '../../services';

import { Observable } from 'rxjs';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class StandardEditorContext extends BSModalContext {
    //是否新增
    public isAdd: boolean;
    //标准的编号
    public standardId: number;

    //已有标准
    standardList: Array<server.S_StandardViewModel> = [];
}

@Component({
    // moduleId: module.id,
    selector: 'standard-editor',
    styleUrls: ['standard-editor.component.css'],
    templateUrl: 'standard-editor.component.html'
})

export class StandardEditorComponent implements CloseGuard, OnInit, ModalComponent<StandardEditorContext>  {
    isAdd: boolean = true;
    standardDetail = <server.S_StandardDetailViewModel>{};
    context: StandardEditorContext;

    constructor(public dialog: DialogRef<StandardEditorContext>, private standardService: StandardService, public modal: Modal) {
        dialog.context.size = 'lg';
        dialog.context.inElement = true;
        this.context = dialog.context;
    }

    /**
     * 初始化数据
     */
    ngOnInit(): void {
        if (this.context.isAdd) {
            this.standardDetail = <server.S_StandardDetailViewModel>{
                ID: 0,
                Domains: []
            };
        } else {
            this.standardService.getStandardDetail(this.context.standardId)
                .subscribe(
                (data) => {
                    this.standardDetail = data;
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
        //重名验证
        if (_.findIndex(this.context.standardList, (item) => { return item.StandardName === this.standardDetail.StandardName; }) > -1) {
            this.modal.alert()
                .title('提示')
                .message('标准中文名称已存在！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.standardService.saveStandard(this.standardDetail)
            .subscribe(
            (data) => {
                this.dialog.close({ IsOk: true, model: data });
            });
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}