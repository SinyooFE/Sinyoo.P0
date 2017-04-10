import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Subject } from "rxjs/Subject";
import { Observable } from 'rxjs/Observable';

import { BaseService } from '../';
import { AuthenicationService } from '../authenication';

import { LocalStorageStandardModel, SelectedFieldInfo } from '../../models';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Injectable()
export class StandardService {
    /**
     * 标准页面，记录上一次编辑的标准
     */
    lastStandardModel: LocalStorageStandardModel;

    constructor(private httpHelper: BaseService) {

    }

    /**
     * 设置上次编辑的标准信息
     * @param lsModel
     */
    setLastStandardInfo(lsModel: LocalStorageStandardModel): void {
        this.lastStandardModel = _.cloneDeep(lsModel);
    }

    /**
     * 获取上次编辑的标准信息
     */
    getLastStandardInfo(): LocalStorageStandardModel {
        return this.lastStandardModel;
    }

    /**
     * 返回所有的标准
     */
    getStandardList() {
        return this.httpHelper.get(`/standards`)
            .map(rep => rep as server.S_StandardViewModel[]);
    }

    /**
     * 标准日志
     * @param standardId
     */
    getStandardLog(standardId: number) {
        return this.httpHelper.get(`/standards/${standardId}/log`)
            .map(rep => rep as server.S_LogViewModel[]);
    }

    /**
     * 返回所有的标准,for copy
     * 复制标准和复制域、变量时有区别
     * @param IsStandardCopylist
     */
    getStandardForCopy(isStandardCopylist = true) {
        return this.httpHelper.get(`/standards/forcopy?IsStandardCopylist=${isStandardCopylist}`)
            .map(rep => rep as server.S_StandardCoypViewModel[]);
    }

    /**
     * 返回指定的标准详情
     * @param id
     */
    getStandardDetail(id: number) {
        return this.httpHelper.get(`/standards/${id}`)
            .map(rep => rep as server.S_StandardDetailViewModel);
    }

    /**
     * 删除一个标准
     * @param id
     */
    deleteStandard(id: number) {
        return this.httpHelper.delete(`/standards/${id}`)
            .map((rep) => rep.json())
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
     * 取消删除一个标准
     * @param id
     */
    undoDeleteStandard(id: number) {
        return this.httpHelper.put(`/standards/${id}/undodelete`)
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
     * 保存一个标准
     * @param standard
     */
    saveStandard(standard: server.S_StandardDetailViewModel) {
        if (standard.ID == 0) {//新增
            return this.httpHelper.post(`/standards`, standard)
                .map(rep => rep as server.S_StandardDetailViewModel);
        } else {//修改
            return this.httpHelper.put(`/standards/${standard.ID}`, standard)
                .map(rep => rep as server.S_StandardDetailViewModel);
        }
    }

    /**
     * 复制一个标准
     * @param id
     */
    copyStandard(id: number) {
        return this.httpHelper.post(`/standards/${id}/copy`)
            .map(rep => rep as server.S_StandardDetailViewModel);
    }

    /**
     * 提交标准
     * @param id
     */
    submitStandard(id: number) {
        return this.httpHelper.put(`/standards/${id}/submit`);
    }

    /**
     * 复制域
     * @param id
     */
    copyDomain(standardId: number, variables: SelectedFieldInfo[]) {
        return this.httpHelper.post(`/standards/${standardId}/domains/copy`, variables)
            .map(rep => rep as server.S_DomainViewModel[]);
    }

    /**
     * 复制变量
     * @param standardId
     * @param variables
     */
    copyVariable(standardId: number, domainId: number, variables: SelectedFieldInfo[]) {
        return this.httpHelper.post(`/standards/${standardId}/domains/${domainId}/fields/copy`, variables)
            .map(rep => rep as server.S_FieldViewModel[]);
    }

    /**
     * 标准ID
     * @param standardId
     */
    getDomainList(standardId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains`)
            .map(rep => rep as server.S_DomainViewModel[]);
    }

    /**
    * 标准ID
    * @param standardId
    */
    getDomainListForCopy(standardId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/forcopy`)
            .map(rep => rep as server.S_DomainViewModel[]);

    }

    /**
     * 获取域详情
     * @param domainId
     */
    getDomainDetail(standardId: number, domainId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}`)
            .map(rep => rep as server.S_DomainDetailViewModel);
    }

    /**
     * 域日志
     * @param standardId
     * @param domainId
     */
    getDomainLog(standardId: number, domainId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}/log`)
            .map(rep => rep as server.S_LogViewModel[]);
    }

    /**
     * 保存域信息
     * @param standardId
     * @param domainId
     */
    saveDomainDetail(standardId: number, domainDetail: server.S_DomainDetailViewModel) {
        if (domainDetail.ID === 0) {
            return this.httpHelper.post(`/standards/${standardId}/domains/`, domainDetail)
                .map(rep => rep as server.S_DomainDetailViewModel);
        } else {
            return this.httpHelper.put(`/standards/${standardId}/domains/${domainDetail.ID}`, domainDetail)
                .map(rep => rep as server.S_DomainDetailViewModel);
        }
    }

    /**
     * 删除域信息
     * @param domainId
     */
    deleteDomain(standardId: number, domainId: number) {
        return this.httpHelper.delete(`/standards/${standardId}/domains/${domainId}`)
            .map((rep) => rep.json())
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
     * 取消删除域信息
     * @param domainId
     */
    undoDeleteDomain(standardId: number, domainId: number) {
        return this.httpHelper.put(`/standards/${standardId}/domains/${domainId}/undodelete`)
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
    * 删除变量信息
    * @param domainId
    */
    deleteVariable(standardId: number, domainId: number, variableId: number) {
        return this.httpHelper.delete(`/standards/${standardId}/domains/${domainId}/fields/${variableId}`)
            .map((rep) => rep.json())
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
    * 删除变量信息
    * @param domainId
    */
    undoDeleteVariable(standardId: number, domainId: number, variableId: number) {
        return this.httpHelper.put(`/standards/${standardId}/domains/${domainId}/fields/${variableId}/undodelete`)
            .map((rep) => rep as server.DeletedStatusViewModel);
    }

    /**
     * 保存变量信息
     * @param standardId
     * @param domainId
     * @param variableDetail
     */
    saveVariableDetail(standardId: number, domainId: number, variableDetail: server.S_FieldDetailViewModel) {
        if (variableDetail.ID === 0) {//新增
            return this.httpHelper.post(`/standards/${standardId}/domains/${domainId}/fields/`, variableDetail)
                .map(rep => rep as server.S_FieldDetailViewModel);
        } else {//修改
            return this.httpHelper.put(`/standards/${standardId}/domains/${domainId}/fields/${variableDetail.ID}`, variableDetail)
                .map(rep => rep as server.S_FieldDetailViewModel);
        }
    }

    /**
     * 获取域的变量列表
     * @param domainId
     */
    getVairableList(standardId: number, domainId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}/fields`)
            .map(rep => rep as server.S_FieldViewModel[]);
    }

    /**
     * 获取概念的变量列表
     * @param domainId
     */
    getVairableListForStandard(standardId: number) {
        return this.httpHelper.get(`/standards/${standardId}/fields`)
            .map(rep => rep as server.S_FieldViewModel[]);
    }

    /**
     * 获取域的变量列表
     * @param domainId
     */
    getVairableListForCopy(standardId: number, domainId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}/fields/forcopy`)
            .map(rep => rep as server.S_FieldViewModel[]);
    }


    /**
     * 获取变量的详细信息
     * @param domainId
     */
    getVairableDetail(standardId: number, domainId: number, variableId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}/fields/${variableId}`)
            .map(rep => rep as server.S_FieldDetailViewModel);

    }

    /**
     * 变量日志
     * @param standardId
     * @param domainId
     * @param variableId
     */
    getVariableLog(standardId: number, domainId: number, variableId: number) {
        return this.httpHelper.get(`/standards/${standardId}/domains/${domainId}/fields/${variableId}/log`)
            .map(rep => rep as server.S_LogViewModel[]);
    }

}