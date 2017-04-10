
import { Component, OnInit, AfterViewInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { QueryAuthorizeInfo, MyTaskService, TerminologyService } from '../../services';

import { TaskOperateType, ApprovalStatus, TaskCategory, DomainObservationType, DomainObservationTypeEn} from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class DomainCompareContext extends BSModalContext {
    public domainId: string;
    public logId: number;
    public forApproval: boolean;
}

/**
 * 域对比弹窗
 */
@Component({
    selector: 'domain-compare',
    styleUrls: ['mytask-compare-domain.component.css'],
    templateUrl: 'mytask-compare-domain.component.html'
})
export class DomainCompareDialog implements CloseGuard, OnInit, AfterViewInit, ModalComponent<DomainCompareContext> {

    //传递过来的数据，并实例化
    context: DomainCompareContext;
    //旧值
    originalVal;
    //旧值SynonymDomains同义词
    original_SynonymDomains;
    //新值
    currentVal;
    //新值SynonymDomains同义词
    current_SynonymDomains;
    //域的详情
    logDetail;
    //如果有评论的输入框，必须输入才行
    Remark: string;
    //该域是否已经审核，默认为false
    hasApprovePermission: boolean = false;
    //弹窗的标题默认为-修改
    Title: string = "修改";
    //域的观测类型
    domainObservationType = DomainObservationType;
    //域的观测类型-En
    domainObservationTypeEn = DomainObservationTypeEn;

    constructor(private terminologyService: TerminologyService,
        public dialog: DialogRef<DomainCompareContext>,
        private myTaskService: MyTaskService,
        public modal: Modal,
        private queryAuthorizeInfo: QueryAuthorizeInfo) {
        //把传过来的StandardCompareContext的数据实例化为context
        this.context = dialog.context;
        dialog.context.inElement = false;
        //初始化弹窗大小
        dialog.context.dialogClass = "modal-dialog half-modal-dialog";
        //
        dialog.setCloseGuard(this);
        this.Remark = "";
        console.log("审核：" + this.context.forApproval);
    }


    ngOnInit(): void {
        //判断当下的用户是否有审核权限
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.hasApprovePermission = auth.P0_ApproveConcept;
            console.log("审核权限：" + this.hasApprovePermission);
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
        */
        //获取域（域下面无变量）的日志详情，方法都是getStandardLogById
        this.myTaskService
            .getStandardLogById(this.context.logId)
            .subscribe(rep => {
                //将返回值赋给logDetail
                this.logDetail = rep;
                //将审核的意见赋给Remark
                this.Remark = this.logDetail.ProcRemark;

                //判断这个域是否有“旧”的值，或者“新”的值，并转为json格式
                this.originalVal = rep.OriginalValue ? JSON.parse(rep.OriginalValue) : null;
                this.currentVal = rep.CurrentValue ? JSON.parse(rep.CurrentValue) : null;

                //如果只有旧值,则显示一半大小
                if (this.originalVal !== null && this.currentVal == null) {
                    this.Title = "删除的域";
                    //对同义词进行id的重写，id从1开始                 
                    if (this.originalVal.SynonymDomains.length !== 0) {
                        for (let i = 0; i < (this.originalVal.SynonymDomains.length); i++) {
                            this.originalVal.SynonymDomains[i].ID = (i + 1);
                        }
                    }
                    this.context.dialogClass = "modal-dialog half-modal-dialog";
                    //this.conceptId = this.originalVal.ConceptID;
                }
                //如果只有新值,则显示一半大小
                else if (this.currentVal !== null && this.originalVal == null) {
                    this.Title = "新增的域";
                    //对同义词进行id的重写，id从1开始
                    if (this.currentVal.SynonymDomains.length !== 0) {
                        for (let i = 0; i < (this.currentVal.SynonymDomains.length); i++) {
                            this.currentVal.SynonymDomains[i].ID = (i + 1);
                        }
                    }
                    this.context.dialogClass = "modal-dialog half-modal-dialog";
                    //this.conceptId = this.currentVal.ConceptID;
                }
                //否则显示大弹窗，以显示新旧对比
                else {
                    this.Title = "修改的域";
                    if (this.originalVal.SynonymDomains.length !== 0) {
                        for (let i = 0; i < (this.originalVal.SynonymDomains.length); i++) {
                            this.originalVal.SynonymDomains[i].ID = (i + 1);
                        }
                    }
                    if (this.currentVal.SynonymDomains.length !== 0) {
                        for (let i = 0; i < (this.currentVal.SynonymDomains.length); i++) {
                            this.currentVal.SynonymDomains[i].ID = (i + 1);
                        }
                    }
                    //对同义词进行排序，返回新数组

                    this.context.dialogClass = "modal-dialog big-modal-dialog";
                }
            });
    }
    //在ngAfterViewChecked每次做完组件视图和子视图的变更检测之后调用。 会执行多次
    //ngAfterViewInit初始化完组件视图及其子视图之后调用。只调用一次
    ngAfterViewInit(): void {
        //this.setTreeData();

        ////编辑器
        //$(".summernote").summernote({
        //    lang: 'zh-CN',
        //    minHeight: '250px'
        //});
    }


    //点击审核通过按钮触发的函数：approve
    approve() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        this.myTaskService
            .approveDomain(this.context.domainId, this.context.logId, this.Remark)
            .subscribe(data => {
                this.dialog.close({ IsOk: true });
                this.showAlert("审核成功！");
            });
    }

    reject() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        //拒绝概念,必须要填写remark
        /*
            如果
        */
        if (this.Remark.trim().length === 0) {
            this.modal.alert()
                .title('警告')
                .message('否决域,请提供说明！')
                .okBtn('确定')
                .size('sm')
                .open();
        } else {
            this.myTaskService.rejectDomain(this.context.domainId, this.context.logId, this.Remark)
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