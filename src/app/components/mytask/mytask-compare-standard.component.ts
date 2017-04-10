
import { Component, OnInit, AfterViewInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { QueryAuthorizeInfo, MyTaskService, TerminologyService } from '../../services';

import { TaskOperateType, ApprovalStatus, TaskCategory } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class StandardCompareContext extends BSModalContext {
    public logId: number;
    public standardId: string;
    public forApproval: boolean;
}

/**
 * 标准对比弹窗
 */
@Component({
    selector: 'standard-compare',
    styleUrls: ['mytask-compare-standard.component.css'],
    templateUrl: 'mytask-compare-standard.component.html'
})
export class StandardCompareDialog implements CloseGuard, OnInit, AfterViewInit, ModalComponent<StandardCompareContext> {
    //传递过来的数据，并实例化
    context: StandardCompareContext;
    //旧的的标准类型名
    originalStandardTypeName: string;
    //新的的标准类型名
    currentStandardTypeName: string;
    //旧标准值
    originalVal;
    //新标准值
    currentVal;
    //标准的概念值
    logDetail;
    //标准详情
    standardDetail;
    //评论的意见内容，必须输入才行
    Remark: string;
    hasApprovePermission: boolean = false;
    //默认暂时未修改
    Title: string = "修改";

    constructor(private terminologyService: TerminologyService,
        public dialog: DialogRef<StandardCompareContext>,
        private myTaskService: MyTaskService,
        public modal: Modal,
        private queryAuthorizeInfo: QueryAuthorizeInfo) {
        //把传过来的StandardCompareContext的数据实例化为context
        this.context = dialog.context;
        dialog.context.inElement = false;
        //初始化弹窗大小
        dialog.context.dialogClass = "modal-dialog half-modal-dialog";
        //??
        dialog.setCloseGuard(this);
        this.Remark = "";
    }

    ngOnInit(): void {
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.hasApprovePermission = auth.P0_ApproveConcept;
        });
        //这个方法只需要传logid即可，可以获取标准、域、变量
        /*
            {
              "ID": 0,
              "ProcTime": "2017-01-09T01:45:37.122Z",
              "SubmitterID": "string",
              "SubmitterName": "string",
              "ProcRemark": "string",
              "LogAction": 1,
              "AuditAction": 0,
              "IsLatest": true,
              "LogType": 1,

              "TargetID": 0,
              "OriginalValue": "string",
              "CurrentValue": "string"
            }
        问题1、originalVal、currentVal的数据结构
        问题2、获取标准的详细信息接口是哪个？
        */
        this.myTaskService
            .getStandardLogById(this.context.logId)
            .subscribe(rep => {
                this.Title = "修改";
                this.logDetail = rep;
                this.Remark = this.logDetail.ProcRemark;

                //初始化这个概念是否有“旧”的值，或者“新”的值
                this.originalVal = rep.OriginalValue ? JSON.parse(rep.OriginalValue) : null;
                this.currentVal = rep.CurrentValue ? JSON.parse(rep.CurrentValue) : null;


                //如果只有旧值或新值,则显示一半大小(即，没有新旧的对比)
                if (this.originalVal !== null && this.currentVal == null) {
                    this.Title = "删除的标准";
                    //this.dialog.context.dialogClass = "modal-dialog half-modal-dialog ";
                    //this.conceptId = this.originalVal.ConceptID;
                }
                else if (this.currentVal !== null && this.originalVal == null) {
                    this.Title = "新增的标准";
                    //this.dialog.context.dialogClass = "modal-dialog half-modal-dialog ";
                    //this.conceptId = this.currentVal.ConceptID;
                }
                //否则显示大弹窗，以显示新旧对比
                else {
                    //this.dialog.context.dialogClass = "modal-dialog big-modal-dialog";
                }
            });
    }

    ngAfterViewInit(): void {
    }

    /**
     * 审核通过
     */
    approve() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        this.myTaskService
            .approveStandard(this.context.standardId, this.context.logId, this.Remark)
            .subscribe(data => {
                this.dialog.close({ IsOk: true });
                this.showAlert("审核成功！");
            });

    }

    /**
     * 驳回
     */
    reject() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        if (this.Remark.trim().length === 0) {//拒绝概念,必须要填写remark
            this.modal.alert()
                .title('警告')
                .message('否决概念,必须提供说明！')
                .okBtn('确定')
                .size('sm')
                .open();
        } else {
            this.myTaskService.rejectStandard(this.context.standardId, this.context.logId, this.Remark)
                .subscribe(data => {
                    this.dialog.close({ IsOk: true });
                });

            /*
                if (this.context.targetType == TargetType.标准) {
                this.myTaskService.rejectStandard(this.context.standardId, this.context.logId, this.Remark)
                    .subscribe(data => {
                        this.dialog.close({ IsOk: true });
                    });
                } else if (this.context.targetType == TargetType.域) {
                    this.myTaskService.rejectDomain(this.context.standardId, this.context.logId, this.Remark)
                        .subscribe(data => {
                            this.dialog.close({ IsOk: true });
                        });
                } else if (this.context.targetType == TargetType.变量) {
                    this.myTaskService.rejectVariable(this.context.standardId, this.context.logId, this.Remark)
                        .subscribe(data => {
                            this.dialog.close({ IsOk: true });
                        });
                }
            */
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