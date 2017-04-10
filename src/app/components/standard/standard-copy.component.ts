/**
* 标准复制组件
*/
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

import { StandardService } from '../../services';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class StandardCopyContext extends BSModalContext {

}

@Component({
    // moduleId: module.id,
    selector: 'standard-copy',
    styleUrls: ['standard-copy.component.css'],
    templateUrl: 'standard-copy.component.html'
})

export class StandardCopyComponent implements CloseGuard, OnInit, ModalComponent<StandardCopyContext>  {
    stanards: server.S_StandardCoypViewModel[];
    selectId: number = -1;

    constructor(public dialog: DialogRef<StandardCopyContext>, private standardService: StandardService, private modal: Modal) {
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);
    }

    ngOnInit(): void {
        this.standardService.getStandardForCopy()
            .subscribe(
            (data) => {
                this.stanards = data;
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
     * 选中的id
     * @param id
     */
    selectStandard(id: number) {
        this.selectId = id;
    }

    /**
     * 确认复制
     */
    ok() {
        if (this.selectId === -1) {
            this.modal.alert()
                .title('警告')
                .message('请先选择一个标准!')
                .okBtn('确定')
                .size('sm')
                .open();
        } else {
            this.standardService.copyStandard(this.selectId)
                .subscribe(
                (data) => {
                    this.dialog.close({ IsOk: true, model: data });
                });
        }
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}