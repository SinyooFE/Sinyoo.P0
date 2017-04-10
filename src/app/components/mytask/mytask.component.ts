/**
 * Created by wang ya zheng on 2016/11/01.
 */
import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { OptionSelectDialog, OptionSelectContext } from './option-select.component';
import { MyTaskListTypeEnum, IMyTaskListFilter, MyTaskListComponent } from './mytask-list.component';

import { OptionsModel, OptionItem } from '../../models';
import { TaskOperateType, ApprovalStatus, TaskCategory, StandardTaskCategory } from 'crabyter-p0-server/Enum';

import { MyTaskService } from '../../services/mytask';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'my-task',
    styleUrls: ['mytask.component.css'],
    templateUrl: 'mytask.component.html'
})
export class MyTaskComponent implements OnInit {
    //任务类型过滤器
    private taskTypeFilters: OptionsModel;
    //任务类型过滤器：数据模板
    private taskTypeDataTemplateFilters: OptionsModel;

    //当前状态过滤器
    private taskStatusFilters: OptionsModel;
    //审核人员过滤器
    private approverFilters: OptionsModel;
    //任务类型枚举值TaskOperateType {新增=1,修改=2,删除=3,}
    //审核状态:ApprovalStatus {无=0,未提交=1,待审核=2,审核未通过=3,审核通过=4,已取消=5 ,审核部分通过 = 6}
    //数据模板子类型：StandardTaskCategory 0全部、1标准、2域、3变量

    //切换大选项卡：叙词表、数据模板、Mapping，默认显示叙词表
    thisTypeNum: number = 1;
    //切换 1我的任务、2待审核、3我的审核，通过数值判断，默认显示为我的全部任务,所以全部赋值为1
    thisConceptListTypeNum: number = 1;//叙词表

    thisStandardListTypeNum: number = 1;//状态类别
    thisStandardTypeNum: number = 0;//标准的类别（全部/标准/域/变量）

    thisMappingListTypeNum: number = 1;//Mapping

    /*--------------------叙词表列表-变量声明（全部，待审核，我的审核）--------------------*/
    myConceptTaskList: IMyTaskListFilter;
    //叙词表“待审核”列表
    toBeHandleConceptTaskList: IMyTaskListFilter;
    //叙词表“我的审核”列表
    myHandledConceptTaskList: IMyTaskListFilter;


    /*-------------------数据模板列表-变量声明（全部，待审核，我的审核）-------------------*/
    //全部转台
    myStandardTaskList_all: IMyTaskListFilter;
    myStandardTaskList_standard: IMyTaskListFilter;
    myStandardTaskList_domain: IMyTaskListFilter;
    myStandardTaskList_variable: IMyTaskListFilter;
    //数据模板"待审核"状态列表
    toBeHandleStandardTaskList_all: IMyTaskListFilter;
    toBeHandleStandardTaskList_standard: IMyTaskListFilter;
    toBeHandleStandardTaskList_domain: IMyTaskListFilter;
    toBeHandleStandardTaskList_variable: IMyTaskListFilter;
    //数据模板"我的审核"状态列表
    myHandledStandardTaskList_all: IMyTaskListFilter;
    myHandledStandardTaskList_standard: IMyTaskListFilter;
    myHandledStandardTaskList_domain: IMyTaskListFilter;
    myHandledStandardTaskList_variable: IMyTaskListFilter;

    /*-------------------Mapping列表-变量声明（全部，待审核，我的审核）-------------------*/
    myMappingTaskList: IMyTaskListFilter;
    //Mappiing"待审核"列表
    toBeHandleMappingTaskList: IMyTaskListFilter;
    //Mapping"我的审核"列表
    myHandledMappingTaskList: IMyTaskListFilter;

    //MyTaskComponent构造器，实例化myTaskService服务对象
    constructor(private myTaskService: MyTaskService, private router: Router) { }

    //初始化
    ngOnInit(): void {
        //任务类型过滤器初始化，将三个状态导入
        this.taskTypeFilters = new OptionsModel();
        this.taskTypeFilters.Options.push({ key: TaskOperateType.新增.toString(), value: TaskOperateType[TaskOperateType.新增], isSelected: true });
        this.taskTypeFilters.Options.push({ key: TaskOperateType.修改.toString(), value: TaskOperateType[TaskOperateType.修改], isSelected: true });
        this.taskTypeFilters.Options.push({ key: TaskOperateType.删除.toString(), value: TaskOperateType[TaskOperateType.删除], isSelected: true });
        //任务状态过滤器初始化，将三个状态导入
        this.taskStatusFilters = new OptionsModel();
        this.taskStatusFilters.Options.push({ key: ApprovalStatus.审核未通过.toString(), value: ApprovalStatus[ApprovalStatus.审核未通过], isSelected: true });
        this.taskStatusFilters.Options.push({ key: ApprovalStatus.审核通过.toString(), value: ApprovalStatus[ApprovalStatus.审核通过], isSelected: true });
        this.taskStatusFilters.Options.push({ key: ApprovalStatus.待审核.toString(), value: ApprovalStatus[ApprovalStatus.待审核], isSelected: true });

        //审核人过滤器初始化，将审核人员导入
        this.approverFilters = new OptionsModel();
        //获取审核人员列表
        this.myTaskService.getApproverList()
            .subscribe(rep => {
                for (let approverItem of rep)
                    this.approverFilters.Options.push({ key: approverItem.Approver, value: approverItem.ApproverName, isSelected: true });
            });


        //初始化叙词表列表实例
        this.myConceptTaskList = new MyTaskList(TaskCategory.术语, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        //初始化叙词表“待审核”列表实例
        this.toBeHandleConceptTaskList = new ToBeHandledTaskList(TaskCategory.术语, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        //初始化叙词表“我的审核”列表实例
        this.myHandledConceptTaskList = new MyHandledTaskList(TaskCategory.术语, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        /*---------------------------------------这12个对象是数据模板中的3个状态【全部、待审核，我的审核】和4个类型的组合【全部、标准、域、变量】------------------------------------------*/
        //初始化数据模板表列表实例
        this.myStandardTaskList_all = new MyTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        this.myStandardTaskList_standard = new MyTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.标准);
        this.myStandardTaskList_domain = new MyTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.域);
        this.myStandardTaskList_variable = new MyTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.变量);
        //初始化数据模板“待审核”表列表实例
        this.toBeHandleStandardTaskList_all = new ToBeHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        this.toBeHandleStandardTaskList_standard = new ToBeHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.标准);
        this.toBeHandleStandardTaskList_domain = new ToBeHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.域);
        this.toBeHandleStandardTaskList_variable = new ToBeHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.变量);
        //初始化数据模板“我的审核”表列表实例
        this.myHandledStandardTaskList_all = new MyHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        this.myHandledStandardTaskList_standard = new MyHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.标准);
        this.myHandledStandardTaskList_domain = new MyHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.域);
        this.myHandledStandardTaskList_variable = new MyHandledTaskList(TaskCategory.标准, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.变量);

        //初始化Mapping列表实例
        this.myMappingTaskList = new MyTaskList(TaskCategory.映射, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        //初始化Mapping“待审核”列表实例
        this.toBeHandleMappingTaskList = new ToBeHandledTaskList(TaskCategory.映射, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);
        //初始化Mapping“我的审核”列表实例
        this.myHandledMappingTaskList = new MyHandledTaskList(TaskCategory.映射, _.cloneDeep(this.taskTypeFilters), _.cloneDeep(this.taskStatusFilters), this.approverFilters, false, this.myTaskService, StandardTaskCategory.全部);

    }
    //三个大选项卡的切换：叙词表、数据模板、Mapping
    SwitchTapHandle(typeNum) {
        this.thisTypeNum = typeNum;
    }
    //叙词表的三个小选项卡的切换：1我的任务、2待审核、3我的审核
    SwitchConceptToBeHandle(ListTypeNum) {
        this.thisConceptListTypeNum = ListTypeNum;
    }

    //标准的三个状态选项卡的切换：1我的任务、2待审核、3我的审核、
    SwitchStandardToBeHandle(ListTypeNum) {
        this.thisStandardListTypeNum = ListTypeNum;
    }
    //标准的三个类型选项卡的切换：0全部类型、1标准、2域、3变量
    SwitchStandardType(TypeNum) {
        this.thisStandardTypeNum = TypeNum;
    }

    //Mapping的三个状态选项卡的切换：1我的任务、2待审核、3我的审核
    SwitchMappingToBeHandle(ListTypeNum) {
        this.thisMappingListTypeNum = ListTypeNum;
    }

}

/**
 * “全部任务列表”类
 */
class MyTaskList implements IMyTaskListFilter {
    public MyTaskListType: MyTaskListTypeEnum;

    /**
     * 我的任务列表,构造函数
     * @param TaskCategory   叙词表1/标准2/Mapping3
     * @param MyTaskListType 任务列表类型:我的全部任务/待审核/我的审核
     * @param taskTypeFilters 任务操作过滤器
     * @param taskStatusFilters 任务状态过滤器
     * @param approverFilters 任务审核者过滤器
     * @param MyTaskAsc 任务提交时间升序还是降序
     * @param myTaskService 我的任务的服务
     */
    public constructor(
        public TaskCategory: TaskCategory,
        public taskTypeFilters: OptionsModel,
        public taskStatusFilters: OptionsModel,
        public approverFilters: OptionsModel,
        public MyTaskAsc: boolean,
        private myTaskService: MyTaskService,
        public StandardTaskCategory: StandardTaskCategory) {
        this.MyTaskListType = MyTaskListTypeEnum.我的任务;
    }


    //获取数据
    public filterData(pageNum: number) {
        return this.myTaskService.getMyTasks(this.TaskCategory, this.MyTaskAsc, pageNum,
            this.taskTypeFilters.toString(),
            this.taskStatusFilters.toString(),
            this.approverFilters.toString(),
            this.StandardTaskCategory
        );
    }

}

/**
 * “待审核列表”类
 */
class ToBeHandledTaskList implements IMyTaskListFilter {
    public MyTaskListType: MyTaskListTypeEnum;
    /**
     * 我的任务列表,构造函数
     * @param TaskCategory
     * @param MyTaskListType 任务列表类型
     * @param taskTypeFilters 任务操作过滤器
     * @param taskStatusFilters 任务状态过滤器
     * @param approverFilters 任务审核者过滤器
     * @param MyTaskAsc 任务提交时间升序还是降序
     * @param myTaskService 我的任务的服务
     */
    public constructor(
        public TaskCategory: TaskCategory,
        public taskTypeFilters: OptionsModel,
        public taskStatusFilters: OptionsModel, public approverFilters: OptionsModel,
        public MyTaskAsc: boolean, private myTaskService: MyTaskService,
        public StandardTaskCategory: StandardTaskCategory) {
        this.MyTaskListType = MyTaskListTypeEnum.待审核任务;
    }


    //获取数据
    public filterData(pageNum: number) {
        return this.myTaskService.getToBeHandleTasks(this.TaskCategory, this.MyTaskAsc, pageNum,
            this.taskTypeFilters.toString(),
            this.taskStatusFilters.toString(),
            this.approverFilters.toString(),
            this.StandardTaskCategory
        );
    }

}


/**
 * “我的审核列表”类
 */
class MyHandledTaskList implements IMyTaskListFilter {
    public MyTaskListType: MyTaskListTypeEnum;
    /**
     * 我的任务列表,构造函数
     * @param TaskCategory
     * @param MyTaskListType 任务列表类型
     * @param taskTypeFilters 任务操作过滤器
     * @param taskStatusFilters 任务状态过滤器
     * @param approverFilters 任务审核者过滤器
     * @param MyTaskAsc 任务提交时间升序还是降序
     * @param myTaskService 我的任务的服务
     */
    public constructor(
        public TaskCategory: TaskCategory,
        public taskTypeFilters: OptionsModel,
        public taskStatusFilters: OptionsModel, public approverFilters: OptionsModel,
        public MyTaskAsc: boolean, private myTaskService: MyTaskService,
        public StandardTaskCategory: StandardTaskCategory) {
        this.MyTaskListType = MyTaskListTypeEnum.我的审核;
    }


    //获取数据
    public filterData(pageNum: number) {
        return this.myTaskService.getMyHandledTasks(this.TaskCategory, this.MyTaskAsc, pageNum,
            this.taskTypeFilters.toString(),
            this.taskStatusFilters.toString(),
            this.approverFilters.toString(),
            this.StandardTaskCategory
        );
    }

}

