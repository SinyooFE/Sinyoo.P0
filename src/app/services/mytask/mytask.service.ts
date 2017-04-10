import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Subject } from "rxjs/Subject";

import { BaseService } from '../';
import { AuthenicationService } from '../authenication';

import { TaskCategory, StandardTaskCategory } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

@Injectable()
export class MyTaskService {
    constructor(private httpHelper: BaseService) {

    }

    /**
     * 获取我的任务
     * @param asend
     * @param pageNum
     * @param taskoperatorFilter
     * @param taskStatusFilter
     * @param approverFilter
     */
    getMyTasks(taskCategory: TaskCategory, asend: boolean = false, pageNum: number = 1, taskoperatorFilter: string = "", taskStatusFilter: string = "", approverFilter: string = "", standardTaskCategory: StandardTaskCategory) {
        let url = this.prepareUrl(`/tasks/mytasks?taskCategory=${taskCategory}&Ascend=${asend}&pageNum=${pageNum}&standardTaskCategory=${standardTaskCategory}`, taskoperatorFilter, taskStatusFilter, approverFilter);
        return this.httpHelper.get(encodeURI(url))
            .map(rep => rep as server.K_TaskPaganition);
    }

    /**
     * 获取待审核任务
     * @param asend
     * @param pageNum
     * @param taskoperatorFilter
     * @param taskStatusFilter
     * @param approverFilter
     */
    getToBeHandleTasks(taskCategory: TaskCategory, asend: boolean = false, pageNum: number = 1, taskoperatorFilter: string = "", taskStatusFilter: string = "", approverFilter: string = "", standardTaskCategory: StandardTaskCategory) {
        let url = this.prepareUrl(`/tasks/tobehandle?taskCategory=${taskCategory}&Ascend=${asend}&pageNum=${pageNum}&standardTaskCategory=${standardTaskCategory}`, taskoperatorFilter, taskStatusFilter, approverFilter);
        return this.httpHelper.get(encodeURI(url))
            .map(rep => rep as server.K_TaskPaganition);
    }

    /**
     * 获取我处理过的任务
     * @param asend
     * @param pageNum
     * @param taskoperatorFilter
     * @param taskStatusFilter
     * @param approverFilter
     */
    getMyHandledTasks(taskCategory: TaskCategory, asend: boolean = false, pageNum: number = 1, taskoperatorFilter: string = "", taskStatusFilter: string = "", approverFilter: string = "", standardTaskCategory: StandardTaskCategory) {
        let url = this.prepareUrl(`/tasks/myhandled?taskCategory=${taskCategory}&Ascend=${asend}&pageNum=${pageNum}&standardTaskCategory=${standardTaskCategory}`, taskoperatorFilter, taskStatusFilter, approverFilter);
        return this.httpHelper.get(encodeURI(url))
            .map(rep => rep as server.K_TaskPaganition);
    }

    /**
     * 检查概念是否被删除
     * @param conceptId 概念的id
     */
    isConceptDelelted(conceptId: string) {
        return this.httpHelper.get(`/concepts/${conceptId}/IsDeleted`).map(rep => rep as boolean);
    }

    private prepareUrl(baseUrl: string, taskoperatorFilter: string = "", taskStatusFilter: string = "", approverFilter: string = ""): string {
        let url = baseUrl;
        if (taskoperatorFilter.trim().length > 0)
            url += `&taskTypeFilter=${taskoperatorFilter}`;
        if (taskStatusFilter.trim().length > 0)
            url += `&taskStatus=${taskStatusFilter}`;
        if (approverFilter.trim().length > 0)
            url += `&approver=${approverFilter}`;
        return url;
    }

    /**
     * 获取当前登陆用户所提交的所有任务的，批准人信息
     */
    getApproverList(/*taskCategory: server.TaskCategory*/) {
        //todo:这里应该根据任务类型选出不同的批准人,但是据说批准人不多.
        return this.httpHelper.get(`/tasks/mytasks/allapprover?taskCategory=${TaskCategory.全部}`)
            .map(rep => rep as server.ActualApproverViewModel[]);
    }

    /**
     * 得到概念的指定日志的详细信息
     * @param conceptId
     * @param logId
     */
    getConceptLogById(conceptId: string, logId: number) {
        return this.httpHelper.get(`/concepts/${conceptId}/logs/${logId}`)
            .map(rep => rep as server.T_ConceptLogViewModel);
    }

    /**
     * 获取标准的日志(包括标准,域和变量)
     * @param logId
     */
    getStandardLogById(logId: number) {
        return this.httpHelper.get(`/standardlogs/${logId}`)
            .map(rep => rep as server.S_LogViewModel);
    }

    /**
     * 获取域下面的变量
     * @param logId
     */
    getVariableOfDomain(taskId: number, groupId: string) {
        return this.httpHelper.get(`/tasks/domainvariable/${taskId}/${groupId}`)
            .map(rep => rep as server.K_TaskViewModel[]);
    }

    /**
     * 批准概念
     * @param conceptId
     * @param logId
     * @param remark
     */
    approveConcept(conceptId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/concepts/${conceptId}/approve?logId=${logId}&remark=${remark}`);

    }
    /**
     * 否决概念
     * @param conceptId
     * @param logId
     * @param remark
     */
    rejectConcept(conceptId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/concepts/${conceptId}/reject?logId=${logId}&remark=${remark}`);

    }

    /**
     * 批准标准
     * @param standardId
     * @param logId
     * @param remark
     */
    approveStandard(standardId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/standards/${standardId}/approve?logId=${logId}&remark=${remark}`);
    }

    /**
     * 否决标准
     * @param standardId
     * @param logId
     * @param remark
     */
    rejectStandard(standardId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/standards/${standardId}/reject?logId=${logId}&remark=${remark}`);
    }

    /**
     * 批准域
     * @param domainId
     * @param logId
     * @param remark
     */
    approveDomain(domainId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/domains/${domainId}/approve?logId=${logId}&remark=${remark}`);
    }

    /**
     * 否决域
     * @param domainId
     * @param logId
     * @param remark
     */
    rejectDomain(domainId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/domains/${domainId}/reject?logId=${logId}&remark=${remark}`);
    }

    /**
     * 批准变量
     * @param variableId
     * @param logId
     * @param remark
     */
    approveVariable(variableId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/fields/${variableId}/approve?logId=${logId}&remark=${remark}`);
    }

    /**
     * 否决变量
     * @param variableId
     * @param logId
     * @param remark
     */
    rejectVariable(variableId: string, logId: number, remark: string) {
        return this.httpHelper.put(`/fields/${variableId}/reject?logId=${logId}&remark=${remark}`);
    }

    /**
     * 获取概念类型的信息
     * @param conceptTypeId
     */
    getConceptTypeName(conceptTypeId: string) {
        return this.httpHelper.get(`/concepttypes/${conceptTypeId}`)
            .map(data => (<server.T_ConceptTypeViewModel>data).ConceptTypeName);
    }
}