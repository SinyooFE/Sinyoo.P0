import { Injectable, Output, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { Subject } from "rxjs/Subject";

import { BaseService } from '../';
import { AuthenicationService } from '../authenication';

import * as server from 'crabyter-p0-server/ViewModel';

export class ReportConceptDetail {
    action: number;
    detail: server.T_ConceptDetailViewModel;
}

@Injectable()
export class TerminologyService {
    //编辑组件传递详情信息到树
    @Output() reportConceptDetail = new EventEmitter<ReportConceptDetail>();

    constructor(private httpHelper: BaseService) {

    }

    /**
     * 概念树
     * @param parentID
     * @param filter
     * @param conceptTypeIDs
     */
    getConceptTreeData(parentID: string = '', filter: string = '', conceptTypeIDs: string = '') {
        return this.httpHelper.get(`/concepts?parentID=${parentID}&filter=${filter}&conceptTypeIDs=${conceptTypeIDs}`);
    }

    /**
     * 获取展开树
     * @param ids
     */
    getConceptSelectedTreeData(ids: string = null) {
        return this.httpHelper.get(`/concepts/selectedtree?Ids=${ids}`);
    }

    /**
     * Approve里的概念
     */
    getApprovedConceptTreeData(parentId: string = '') {
        return this.httpHelper.get(`/approvedconcepts?parentID=${parentId}`)
            .map(rep => rep as server.T_ConceptTreeModel[]);
    }

    /**
     * 根据id和父ID选择所有父级及兄弟
     * @param id
     * @param pId
     */
    getConceptTreeByIdAndPId(id: string, pId: string) {
        return this.httpHelper.get(`/concepts/${id}/trees?parentId=${pId}`)
            .map(rep => rep as server.T_ConceptTreeModel[]);
    }

    //概念信息
    getConcept(id: string) {
        return this.httpHelper.get(`/concepts/${id}`)
            .map(rep => rep as server.T_ConceptDetailViewModel);
    }

    //删除概念
    deleteConcept(conceptId: string) {
        return this.httpHelper.delete(`/concepts/${conceptId}`);
    }

    //取消删除概念
    undoDeleteConcept(conceptId: string) {
        return this.httpHelper.put(`/concepts/${conceptId}/undodelete`);
    }

    //添加概念
    addConcept(concept: server.T_ConceptDetailViewModel) {
        return this.httpHelper.post(`/concepts`, concept)
            .map(rep => rep as server.T_ConceptDetailViewModel);
    }

    //修改概念
    updateConcept(conceptId: string, concept: any) {
        return this.httpHelper.put(`/concepts/${conceptId}`, concept)
            .map(rep => rep as server.T_ConceptDetailViewModel);
    }

    //修改概念排序
    updateConceptSort(conceptId: string, conceptSort: number, parentId: string) {
        if (parentId == null) {
            parentId = '';
        }
        return this.httpHelper.put(`/concepts/${conceptId}/UpdateSort?sort=${conceptSort}&parentID=${parentId}`);
    }

    //概念日志列表
    getConceptLog(conceptId: string) {
        return this.httpHelper.get(`/concepts/${conceptId}/logs`)
            .map(rep => rep as server.T_ConceptLogViewModel[]);
    }

    //概念附加属性
    getConceptAttribute(conceptId: string, attributeId: string) {
        return this.httpHelper.get(`/concepts/${conceptId}/attributes/${attributeId}`)
            .map(rep => rep as server.T_AttributeViewModel);
    }

    //更新概念附加属性
    updateConceptAttribute(conceptId: string, attributeId: string, attribute: server.T_AttributeViewModel) {
        return this.httpHelper.put('/concepts/{conceptId}/attributes/{attributeId}', attribute);
    }

    //全部概念类型
    getConceptTypes(isBrief: boolean = true) {
        return this.httpHelper.get(`/concepttypes?isBrief=${isBrief}`)
            .map(rep => rep as server.T_ConceptTypeBriefViewModel[]);
    }

    //概念类型详情
    getConceptType(conceptTypeId: string) {
        return this.httpHelper.get(`/concepttypes/${conceptTypeId}`)
            .map(rep => rep as server.T_ConceptTypeViewModel);
    }

    //添加概念类型
    addConceptType(conceptType: server.T_ConceptTypeViewModel) {
        return this.httpHelper.post('/concepttypes', conceptType)
            .map(rep => rep as server.T_ConceptTypeViewModel);
    }

    //修改概念类型
    updateConceptType(concpetTypeId: string, conceptType: server.T_ConceptTypeViewModel) {
        return this.httpHelper.put(`/concepttypes/${concpetTypeId}`, conceptType)
            .map(rep => rep as server.T_ConceptTypeViewModel);
    }

    //删除概念类型
    deleteConceptType(conceptTypeId: string) {
        return this.httpHelper.delete(`/concepttypes/${conceptTypeId}`);
    }

    //概念类型属性列表
    getConceptTypeAttributes(conceptTypeId: string) {
        return this.httpHelper.get(`/concepttypes/${conceptTypeId}/attributes`)
            .map(rep => rep as server.T_ConceptTypeAttributeViewModel[]);
    }

    //获取概念类型的所有属性,用于标准选择,会有几个特定值,用于选择概念上的中文名称等
    getConceptTypeAttributesForStandard(conceptTypeId: string) {
        return this.httpHelper.get(`/concepttypes/${conceptTypeId}/attributes/forstandard`)
            .map(rep => rep as server.T_ConceptTypeAttributeViewModel[]);
    }

    //概念类型属性
    getConceptTypeAttribute(conceptTypeId: string, attributeId: string) {
        return this.httpHelper.get(`/concepttypes/${conceptTypeId}/attributes/${attributeId}`)
            .map(rep => rep as server.T_ConceptTypeAttributeViewModel);
    }

    //添加概念类型属性
    addConceptTypeAttribute(conceptTypeId: string, attribute: server.T_ConceptTypeAttributeViewModel) {
        return this.httpHelper.post(`/concepttypes/${conceptTypeId}/attributes`, attribute)
            .map(rep => rep as server.T_ConceptTypeAttributeViewModel);
    }

    //修改概念类型属性
    updateConceptTypeAttribute(conceptTypeId: string, attributeId: string, attribute: server.T_ConceptTypeAttributeViewModel) {
        return this.httpHelper.put(`/concepttypes/${conceptTypeId}/attributes/${attributeId}`, attribute)
            .map(rep => rep as server.T_ConceptTypeAttributeViewModel);
    }

    //删除概念类型属性
    deleteConceptTypeAttribute(conceptTypeId: string, attributeId: string) {
        return this.httpHelper.delete(`/concepttypes/${conceptTypeId}/attributes/${attributeId}`);
    }

}










