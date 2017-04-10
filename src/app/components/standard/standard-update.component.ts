
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Overlay, overlayConfigFactory, DialogRef, ModalComponent, CloseGuard} from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { StandardLogComponent, StandardLogContext} from './standard-log.component';

import { StandardService } from '../../services';

import { ApprovalStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class StandardUpdateContext extends BSModalContext {
    isAdd: boolean; //预留
    standardId: number;
}

@Component({
    // moduleId: module.id,
    selector: 'standard-update',
    styleUrls: ['standard-update.component.css'],
    templateUrl: 'standard-update.component.html'
})

export class StandardUpdateComponent implements CloseGuard, OnInit {
    standardDetail = <server.S_StandardDetailViewModel>{};
    checkStandardDetail = <server.S_StandardDetailViewModel>{};
    private context: StandardUpdateContext;

    //枚举
    enumApprovalStatus = ApprovalStatus

    //是否显示属性
    isShowAttribute = false;

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private route: ActivatedRoute,
        private location: Location,
        private standardService: StandardService,
        public modal: Modal) {

        overlay.defaultViewContainer = vcRef;
        this.route.params.subscribe(
            params => {
                this.context = <StandardUpdateContext>{
                    isAdd: params['standardid'] == 0,
                    standardId: +params['standardid']
                };
                this.initialData();
            }
        );
    }

    ngOnInit(): void {

    }

    initialData(): void {
        if (this.context.isAdd) {
            this.standardDetail = <server.S_StandardDetailViewModel>{};
            this.checkStandardDetail = _.cloneDeep(this.standardDetail);
        } else {
            this.standardService.getStandardDetail(this.context.standardId)
                .subscribe(
                (data) => {
                    this.standardDetail = data;
                    this.checkStandardDetail = _.cloneDeep(this.standardDetail);
                });
        }
    }

    /**
     * 日志
     */
    showStandardLog(): void {
        this.modal
            .open(StandardLogComponent, overlayConfigFactory({
                standardId: this.context.standardId,
                standardName: this.standardDetail.StandardName
            }, BSModalContext));
    }

    /**
     * 检查是否更新
     */
    checkIsModify(): boolean {
        return !_.isEqual(this.standardDetail, this.checkStandardDetail);
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

        this.standardService.saveStandard(this.standardDetail)
            .subscribe((data) => {
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
            });
    }

    cancel() {
        this.location.back();
    }
}