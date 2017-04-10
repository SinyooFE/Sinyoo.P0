
import { Component, OnInit, AfterViewInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { QueryAuthorizeInfo, MyTaskService, TerminologyService } from '../../services';

import {
    TaskOperateType,
    ApprovalStatus,
    TaskCategory,
    TargetType,
    FieldCoreCategory,
    FieldDataType,
    FieldType,
    FieldStatisticType,
    FieldIsPrivate,
    FieldDataLevel,
    FieldControlType,
    FieldControlTermFormat,
    FieldRole,
    FieldCoreCategoryEn,
    FieldRoleEn,
    ConceptDislpayList
    } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

/*
    域和域变量不同，域指的是它没有若干变量；而域变量指的是域下有若干变量的域
*/
export class VariableCompareContext extends BSModalContext {
    //域变量的groupId——如果有，则表示域下面有变量 ，并且还有通过此groupId获取变量列表
    public groupId: string;
    //域变量的taskId
    public taskId: number;  
    //域变量是否已经被审核
    public forApproval: boolean;
}

/**
 * 域变量对比弹窗
 */
@Component({
    selector: 'variable-compare',
    styleUrls: ['mytask-compare-variable.component.css'],
    templateUrl: 'mytask-compare-variable.component.html'
})
export class VariableCompareDialog implements CloseGuard, OnInit, AfterViewInit, ModalComponent<VariableCompareContext> {
    //传递过来的数据，并实例化
    context: VariableCompareContext;
    //旧变量值
    originalVal;
    //新变量值
    currentVal;
    //变量列表的数据
    variablesData: Array<server.K_TaskViewModel>;
    //变量列表的数据——未审核
    variablesData_noApprove;
    //变量列表的数据——已通过
    variablesData_approved;
    //变量列表的数据——已驳回
    variablesData_rejected;
    //变量的日志值（日志值包含originalVal和currentVal值）
    variableLogDetail;
    //对变量的评论内容（否决时必须填写，不可为空）
    Remark: string;
    //是否有审核的权限
    hasApprovePermission: boolean = false;
    //默认暂时未修改
    Title: string = "修改";
    //选项卡切换的状态值，默认为1，表示全部变量
    tapNum: number = 1;

    //变量id
    variableId: string;
    //变量的logId
    variableLogId: number;  
    //变量的状态
    variableStatus: string;
    //ConceptTypeID，根据这个获取变量的对象列表
    conceptTypeID: string;
    //变量的返回值类型-旧的
    returnValueType_old: string;
    //变量的返回值类型-新的
    returnValueType_new: string;
    //某个变量是否已经审核（isChecked为的是点击审核通过/驳回按钮后，这两个按钮是否消失的标志，初始化是不消失）
    isChecked: boolean = false;
    //审核状态
    /*
        无    =   0 ,
        未提交    =   1 ,
        待审核    =   2 ,
        审核未通过    =   3 ,
        审核通过    =   4 ,
        已取消    =   5 ,
        审核部分通过    =   6 ,
    */
    approvalStatus = ApprovalStatus;
    //核心类型枚举值
    fieldCoreCategory = FieldCoreCategory;
    //核心类型枚举值-En
    fieldCoreCategoryEn = FieldCoreCategoryEn;
    //核心类型枚举值
    fieldDataType = FieldDataType;
    //变量类别
    fieldType = FieldType;
    //统计分类
    fieldStatisticType = FieldStatisticType;
    //是否隐私变量
    fieldIsPrivate = FieldIsPrivate;
    //数据分级
    fieldDataLevel = FieldDataLevel;
    //控件类型
    fieldControlType = FieldControlType;
    //受控术语格式
    fieldControlTermFormat = FieldControlTermFormat;
    //变量角色
    fieldRole = FieldRole;
    //变量角色-En
    fieldRoleEn = FieldRoleEn;
    //关系属性子选项
    conceptDislpayList = ConceptDislpayList;
    //被点击的变量的id
    thisVariableClickedId="";

    constructor(private terminologyService: TerminologyService,
        public dialog: DialogRef<VariableCompareContext>,
        private myTaskService: MyTaskService,
        public modal: Modal,
        private queryAuthorizeInfo: QueryAuthorizeInfo) {
        //把传过来的StandardCompareContext的数据实例化为context
        this.context = dialog.context;
        dialog.context.size;
        dialog.context.inElement = false;
        //初始化弹窗大小
        dialog.context.dialogClass = "modal-dialog big-modal-dialog variable_full_dialog";
        dialog.setCloseGuard(this);
        this.Remark = "";
    }


    ngOnInit(): void {
        //判断此用户是否有权限审核
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.hasApprovePermission = auth.P0_ApproveConcept;
        });
        //获取域变量下的所有变量
        this.myTaskService.getVariableOfDomain(this.context.taskId, this.context.groupId).subscribe(rep => {
            this.variablesData = rep;
            //默认打开弹窗后如果存在第一条数据，则显示第一条数据的log值
            if (this.variablesData[0]) {
                this.getVariableLog(this.variablesData[0].TargetID, this.variablesData[0].LogId, this.variablesData[0].TaskStatus);
            }
            //获取未审核的变量
            this.variablesData_noApprove = _.filter(this.variablesData, i=> {
                return i.TaskStatus === this.approvalStatus.待审核;
            });         
            //获取已通过的变量
            this.variablesData_approved = _.filter(this.variablesData, i => {
                return i.TaskStatus === this.approvalStatus.审核通过;
            });
            //获取已驳回的变量
            this.variablesData_rejected = _.filter(this.variablesData, i => {
                return i.TaskStatus === this.approvalStatus.审核未通过;
            });
            console.log("还剩几个没审核" + this.variablesData_noApprove.length);
        });
        //这个方法只需要传logid即可，可以获取标准、域、变量的日志
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
    }
    /*
        在ngAfterViewChecked每次做完组件视图和子视图的变更检测之后调用。 会执行多次
        ngAfterViewInit初始化完组件视图及其子视图之后调用。只调用一次
    */
    ngAfterViewInit(): void {
    }
    //切换变量类型选项卡
    tapSwitch(tapNumber:number) {
        this.tapNum = tapNumber;
    }
    //通过每个变量的点击事件，获取变量的详细日志
    getVariableLog(thisVariableId: string, thisVariableLogId: number, thisVariableStatus: ApprovalStatus) {
        //获取每个日志后改变此状态
        this.isChecked = false;
        //变量id
        this.variableId = thisVariableId;
        //获取当前被点击的变量的id
        this.thisVariableClickedId = thisVariableId;
        //变量的logId
        this.variableLogId = thisVariableLogId;
        //变量的审核状态
        this.variableStatus = this.approvalStatus[thisVariableStatus];

        this.myTaskService
            .getStandardLogById(thisVariableLogId)
            .subscribe(rep => {
                //某个变量日志的详情数据
                this.variableLogDetail = rep;
                this.Remark = this.variableLogDetail.ProcRemark;

                //初始化这个变量是否有“旧”的值，或者“新”的值
                this.originalVal = rep.OriginalValue ? JSON.parse(rep.OriginalValue) : null;
                this.currentVal = rep.CurrentValue ? JSON.parse(rep.CurrentValue) : null;
                //如果只有旧值,则显示一半大小(即，没有新旧的对比)
                if (this.originalVal !== null && this.currentVal == null) {
                    this.Title = "删除的变量";
                    if (this.originalVal.Options.length !== 0) {
                        for (let i = 0; i < (this.originalVal.Options.length); i++) {
                            this.originalVal.Options[i].ID = (i + 1);
                        }
                    }
                    //获取该变量的概念列表
                    if (this.originalVal.ConceptTypeID) {
                        this.terminologyService.getConceptTypeAttributesForStandard(this.originalVal.ConceptTypeID).subscribe(objList => {
                            if (objList) {
                                for (let i = 0; i < objList.length; i++) {
                                    if (this.originalVal.ReturnValue === objList[i].AttributeID) {
                                        this.returnValueType_old = objList[i].AttributeName;
                                        //判断此变量是否是关系型，2代表关系型，即还有一个下拉选项
                                        if (objList[i].AttributeType === 2) {
                                            this.returnValueType_old += this.conceptDislpayList[this.originalVal.RelatedReturnValue];
                                        }
                                    }
                                }
                            }
                        });
                    }                   
                    this.dialog.context.dialogClass = "modal-dialog big-modal-dialog variable_half_dialog ";
                    //this.conceptId = this.originalVal.ConceptID;
                }
                //如果只有新值，则显示一半大小
                else if (this.currentVal !== null && this.originalVal == null) {
                    this.Title = "新增的变量";
                    if (this.currentVal.Options.length !== 0) {
                        for (let i = 0; i < (this.currentVal.Options.length); i++) {
                            this.currentVal.Options[i].ID = (i + 1);
                        }
                    }
                    //获取该变量的概念列表
                    if (this.currentVal.ConceptTypeID) {
                        this.terminologyService.getConceptTypeAttributesForStandard(this.currentVal.ConceptTypeID).subscribe(objList => {
                            if (objList) {
                                for (let i = 0; i < objList.length; i++) {
                                    if (this.currentVal.ReturnValue === objList[i].AttributeID) {
                                        this.returnValueType_new = objList[i].AttributeName;
                                        //判断此变量是否是关系型，2代表关系型，即还有一个下拉选项
                                        if (objList[i].AttributeType === 2) {
                                            this.returnValueType_new += this.conceptDislpayList[this.currentVal.RelatedReturnValue];
                                        }
                                    }
                                }
                            }
                        });
                    }                   
                    this.dialog.context.dialogClass = "modal-dialog big-modal-dialog variable_half_dialog";
                    //this.conceptId = this.currentVal.ConceptID;
                }
                //新旧都有则显示大窗口，以显示新旧对比
                else {
                    this.Title = "修改的变量";
                    if (this.originalVal.Options.length !== 0) {
                        for (let i = 0; i < (this.originalVal.Options.length); i++) {
                            this.originalVal.Options[i].ID = (i + 1);
                        }
                    }
                    if (this.currentVal.Options.length !== 0) {
                        for (let i = 0; i < (this.currentVal.Options.length); i++) {
                            this.currentVal.Options[i].ID = (i + 1);
                        }
                    }
                    //获取该变量的概念列表-旧的
                    if (this.originalVal.ConceptTypeID) {
                        this.terminologyService.getConceptTypeAttributesForStandard(this.originalVal.ConceptTypeID).subscribe(objList => {
                            if (objList) {
                                for (let i = 0; i < objList.length; i++) {
                                    if (this.originalVal.ReturnValue === objList[i].AttributeID) {
                                        this.returnValueType_old = objList[i].AttributeName;
                                        //判断此变量是否是关系型，2代表关系型，即还有一个下拉选项
                                        if (objList[i].AttributeType === 2) {
                                            this.returnValueType_old += this.conceptDislpayList[this.originalVal.RelatedReturnValue];
                                        }
                                    }
                                }
                            }
                        });
                    }
                    
                    //获取该变量的概念列表-新的
                    if (this.currentVal.ConceptTypeID) {
                        this.terminologyService.getConceptTypeAttributesForStandard(this.currentVal.ConceptTypeID).subscribe(objList => {
                            if (objList) {
                                for (let i = 0; i < objList.length; i++) {
                                    if (this.currentVal.ReturnValue === objList[i].AttributeID) {
                                        this.returnValueType_new = objList[i].AttributeName;
                                        //判断此变量是否是关系型，2代表关系型，即还有一个下拉选项
                                        if (objList[i].AttributeType === 2) {
                                            this.returnValueType_new += this.conceptDislpayList[this.currentVal.RelatedReturnValue];
                                        }
                                    }
                                }
                            }
                        });
                    }
                    
                    this.dialog.context.dialogClass = "modal-dialog big-modal-dialog variable_full_dialog";
                }
            });
    }
    approve() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        this.myTaskService
            .approveVariable(this.variableId, this.variableLogId, this.Remark)
            .subscribe(data => {
                //如果审核通过，提示窗口弹出
                this.modal.alert()
                    .title('变量审核')
                    .message('变量审核成功！')
                    .okBtn('确定')
                    .size('sm')
                    .open();  
                //一旦审核成功则改变状态
                this.isChecked = true;        
                //重新获取获取域变量下的所有变量，
                this.myTaskService.getVariableOfDomain(this.context.taskId, this.context.groupId).subscribe(rep => {
                    //获取所有变量
                    this.variablesData = rep;
                    //过滤获取未审核的变量
                    this.variablesData_noApprove = _.filter(this.variablesData, i => {
                        return i.TaskStatus === this.approvalStatus.待审核;
                    });
                    //过滤获取已通过的变量
                    this.variablesData_approved = _.filter(this.variablesData, i => {
                        return i.TaskStatus === this.approvalStatus.审核通过;
                    });
                    //过滤获取已驳回的变量
                    this.variablesData_rejected = _.filter(this.variablesData, i => {
                        return i.TaskStatus === this.approvalStatus.审核未通过;
                    });
                    console.log("approve()方法后再次请求的-未审核数量" + this.variablesData_noApprove.length);
                    //每次提交后都要检查域变量下的变量是否都被审核了，如果都被审核了则，关闭弹窗
                    if (this.variablesData_noApprove.length === 0) {
                        //关闭窗口
                        this.dialog.close({ IsOk: true });
                    }
                });    
            });
    }

    reject() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        if (this.Remark.trim().length === 0) {//拒绝概念,必须要填写remark
            this.modal.alert()
                .title('警告')
                .message('否决变量，请提供说明！')
                .okBtn('确定')
                .size('sm')
                .open();
        } else {
            this.myTaskService.rejectVariable(this.variableId, this.variableLogId, this.Remark)
                .subscribe(data => {
                    //弹出提示窗口——提示已经 驳回成功
                    this.modal.alert()
                        .title('提示')
                        .message('成功驳回！')
                        .okBtn('确定')
                        .size('sm')
                        .open();
                    //重新获取获取域变量下的所有变量
                    this.myTaskService.getVariableOfDomain(this.context.taskId, this.context.groupId).subscribe(rep => {
                        this.variablesData = rep;
                        //过滤获取未审核的变量
                        this.variablesData_noApprove = _.filter(this.variablesData, i => {
                            return i.TaskStatus === this.approvalStatus.待审核;
                        });
                        //过滤获取已通过的变量
                        this.variablesData_approved = _.filter(this.variablesData, i => {
                            return i.TaskStatus === this.approvalStatus.审核通过;
                        });
                        //过滤获取已驳回的变量
                        this.variablesData_rejected = _.filter(this.variablesData, i => {
                            return i.TaskStatus === this.approvalStatus.审核未通过;
                        });
                        //一旦驳回则改变状态
                        this.isChecked = true;
                        //每次提交后都要检查域变量下的变量是否都被审核了，如果都被审核了则，关闭弹窗
                        console.log("reject()方法后再次请求的-未审核数量" + this.variablesData_noApprove.length);
                        if (this.variablesData_noApprove.length === 0) {
                            console.log("准备关闭窗口！");
                            //关闭窗口
                            this.dialog.close({ IsOk: true });
                        }
                    });
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
}