/**
 * Created by wang ya zheng on 2016/11/01.
 */
import { Component, OnInit, ViewContainerRef, ViewEncapsulation, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { Observable } from 'rxjs';

import { OptionSelectDialog, OptionSelectContext } from './option-select.component';
import { ConceptCompareDialog, ConceptCompareContext } from './mytask-compare.component';
import { StandardCompareContext, StandardCompareDialog } from './mytask-compare-standard.component';
import { DomainCompareContext, DomainCompareDialog } from './mytask-compare-domain.component';
import { VariableCompareContext, VariableCompareDialog } from './mytask-compare-variable.component';

import { MyTaskService } from '../../services';
import { OptionsModel, OptionItem } from '../../models';

import { TaskOperateType, ApprovalStatus, TaskCategory, TargetType } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

export enum MyTaskListTypeEnum {
    我的任务 = 1,
    待审核任务 = 2,
    我的审核 = 3,
}

export interface IMyTaskListFilter {
    //3个子集列表：我的任务、待审核任务、我的审核
    MyTaskListType: MyTaskListTypeEnum;
    //任务类型过滤器
    taskTypeFilters: OptionsModel;
    //当前状态过滤器
    taskStatusFilters: OptionsModel;
    //审核人员过滤器
    approverFilters: OptionsModel;
    //升序还是降序
    MyTaskAsc: boolean;
    //获取数据
    filterData(pageNum: number): Observable<server.K_TaskPaganition>;
}

/**
 * 我的工作 列表控件
 */

@Component({
    // moduleId: module.id,
    selector: 'my-task-list',
    styleUrls: ['mytask-list.component.css'],
    templateUrl: 'mytask-list.component.html'
})
export class MyTaskListComponent implements OnInit {
    //注入的列表数据对象，9种
    @Input() MyTaskListFilter: IMyTaskListFilter;
    @Input() CurrTaskCategory: TaskCategory;
    @Input() myJobStatusNum;
    //新增、修改、删除
    TaskOperateType = TaskOperateType;
    //审核状态 {无=0,未提交=1,待审核=2,审核未通过=3,审核通过=4,已取消=5 ,审核部分通过 = 6}
    ApprovalStatus = ApprovalStatus;
    //叙词表1/标准2/Mapping3
    TaskCategory = TaskCategory;
    /*
        概念    =   1 ,
        同义词    =   3 ,
        Mapping    =   4 ,

        标准    =   2 , 
        域    =   5 ,
        变量    =   6 ,
        域变量    =   7 ,
    */
    TargetType = TargetType;
    myTask: server.K_TaskPaganition;
    //“angular2-modal/plugins/bootstrap”的modal是最终要弹出的窗口对象
    constructor(private router: Router, private overlay: Overlay, private vcRef: ViewContainerRef, public modal: Modal,
        private myTaskService: MyTaskService) {
        overlay.defaultViewContainer = vcRef;

    }

    /**
     * 初始化数据
     */
    ngOnInit(): void {
        /*
            如果是我的审核选项卡，则筛选“当前状态”时无“待审核”状态
        */
        if (this.myJobStatusNum === 3 && this.MyTaskListFilter.taskStatusFilters.Options.length === 3) {
            this.MyTaskListFilter.taskStatusFilters.Options.pop();
        }
        //获取数据（第一页），根据传过来的MyTaskListFilter对象【包含大类（叙词、标准、Mapping）和小类（所有任务、待审核，我的审核）9种可能】
        this.MyTaskListFilter.filterData(1)
            .subscribe(data => this.myTask = data);

    }

    /**
     * 显示审核弹出框,同意和拒绝后,数据需要对应变化
     * @param targetId
     * @param logId
     * @param toBeApproval
     */
    /*targetId:*/
    conceptCompare(targetId: string, logId: number, targetType: TargetType, operateType: TaskOperateType, taskStaus: ApprovalStatus, toBeApproval: boolean, hasVariable: Boolean, groupId: string, taskId: number) {
        if (operateType == TaskOperateType.删除 && taskStaus == ApprovalStatus.审核通过) {
            //modal对象调用alert弹出提示窗
            return this.modal.alert()
                .title('警告')
                .message('已审核批准的删除任务无法查看！')
                .okBtn('确定')
                .size('sm')
                .open();
        }
        //----------如果是Concept的数据-----------
        if (this.CurrTaskCategory == TaskCategory.术语) {
            //如果父级已经被删除则弹出错误提示框
            this.myTaskService.isConceptDelelted(targetId).subscribe(rep => {
                if (rep) {
                    return this.modal.alert()
                        .title('警告')
                        .message('此概念已经被删除！')
                        .okBtn('确定')
                        .size('sm')
                        .open();
                }
                else {
                    //modal对象调用open()打开模态框
                    return this.modal
                        //下面的overlayConfigFactory中的json参数是与ConceptCompareContext类的属性相匹配的
                        .open(ConceptCompareDialog, overlayConfigFactory({
                            conceptId: targetId,
                            logId: logId,
                            forApproval: toBeApproval
                        }, BSModalContext))
                        .then(data => {
                            data.result.then(ret => {
                                if (ret.IsOk) {
                                    if (this.myTask.Count == 1) this.myTask.PageNumber--;
                                    if (this.myTask.PageNumber < 1) this.myTask.PageNumber = 1;
                                    this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                                        .subscribe(data => this.myTask = data);
                                }
                            });
                        });
                }
            });

        }
        //------------如果是标准的数据-------------
        else if (targetType === TargetType.标准) {
            return this.modal
                .open(StandardCompareDialog, overlayConfigFactory({
                    standardId: targetId,
                    logId: logId,
                    forApproval: toBeApproval
                    //targetType: targetType
                }, BSModalContext))
                .then(data => {
                    data.result.then(ret => {

                        if (ret.IsOk) {
                            if (this.myTask.Count == 1) this.myTask.PageNumber--;
                            if (this.myTask.PageNumber < 1) this.myTask.PageNumber = 1;
                            this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                                .subscribe(data => this.myTask = data);
                        }
                    });
                });
        }
        //------------如果是域-------------
        else if (targetType === TargetType.域) {
            return this.modal
                .open(DomainCompareDialog, overlayConfigFactory({
                    domainId: targetId,
                    logId: logId,
                    forApproval: toBeApproval
                }, BSModalContext))
                .then(data => {
                    console.log("进入这里");
                    data.result.then(ret => {

                        if (ret.IsOk) {
                            if (this.myTask.Count == 1) this.myTask.PageNumber--;
                            if (this.myTask.PageNumber < 1) this.myTask.PageNumber = 1;
                            this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                                .subscribe(data => this.myTask = data);
                        }
                    });
                });

        }
        //------------如果是域变量的数据-------------
        else if (targetType === TargetType.域变量) {
            console.log("targetId：" + targetId);
            return this.modal
                .open(VariableCompareDialog, overlayConfigFactory({
                    taskId: taskId,
                    groupId: groupId,
                    forApproval: toBeApproval,
                    myVariableList: this.MyTaskListFilter
                }, BSModalContext))
                .then(data => {
                    data.result.then(ret => {
                        if (ret.IsOk) {
                            if (this.myTask.Count == 1) this.myTask.PageNumber--;
                            if (this.myTask.PageNumber < 1) this.myTask.PageNumber = 1;
                            this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                                .subscribe(data => this.myTask = data);
                        }
                    });
                });

        }
    }

    /**
     * 更改排序信息
     */
    changeMyTaskSort() {

        this.MyTaskListFilter.MyTaskAsc = !this.MyTaskListFilter.MyTaskAsc;
        this.MyTaskListFilter.filterData(this.myTask.PageNumber)
            .subscribe(data => this.myTask = data);
    }
    /**
    * 审核人过滤
    */
    myApproverFilter() {
        return this.modal
            .open(OptionSelectDialog, overlayConfigFactory({ taskFilter: this.MyTaskListFilter.approverFilters }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        this.MyTaskListFilter.approverFilters = <OptionsModel>ret.filter;
                        this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                            .subscribe(data => this.myTask = data);
                    }
                });

            })
            .catch(err => console.log(err));
    }

    /**
    * 任务类型过滤
    */
    myTaskTypeFilter() {
        return this.modal.open(OptionSelectDialog, overlayConfigFactory({ taskFilter: this.MyTaskListFilter.taskTypeFilters }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        this.MyTaskListFilter.taskTypeFilters = <OptionsModel>ret.filter;
                        this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                            .subscribe(data => this.myTask = data);
                    }
                });

            })
            .catch(err => console.log(err));
    }

    /**
     * 任务状态过滤
     */
    myTaskStatusFilter() {
        return this.modal.open(OptionSelectDialog, overlayConfigFactory({ taskFilter: this.MyTaskListFilter.taskStatusFilters }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        this.MyTaskListFilter.taskStatusFilters = <OptionsModel>ret.filter;
                        this.MyTaskListFilter.filterData(this.myTask.PageNumber)
                            .subscribe(data => this.myTask = data);
                    }
                });

            })
            .catch(err => console.log(err));
    }


    navigatorPrePage() {
        let pageNum = this.myTask.PageNumber - 1;
        if (pageNum < 1) return;//不能小于第一页

        this.MyTaskListFilter.filterData(pageNum)
            .subscribe(data => this.myTask = data);
    }
    navigatorNextPage() {
        let pageNum = this.myTask.PageNumber + 1;
        if (pageNum > this.myTask.PageCount) return;//不能超过最后一页
        this.MyTaskListFilter.filterData(pageNum)
            .subscribe(data => this.myTask = data);
    }

    navigatorPage(pageNum: number) {
        this.MyTaskListFilter.filterData(pageNum)
            .subscribe(data => this.myTask = data);
    }
}