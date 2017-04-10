
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Subject } from "rxjs/Subject";
import { Observable } from 'rxjs/Observable';

import { AuthenicationService } from '../authenication';
import { BaseService } from '../';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Injectable()
export class MappingService {

    constructor(private httpHelper: BaseService) {

    }

    /**
     * 获取所有的标准课题
     */
    getMappingList() {
        return this.httpHelper.get('/mappings')
            .map(rep => rep as server.StandardStudyViewModel[]);
    }

    /**
     * 按照标准编号获取对应的课题信息
     * @param standardID
     */
    getStudyByStandardId(standardID: number) {
        return this.httpHelper.get(`/mappings/bystandard/${standardID}`)
            .map(rep => rep as server.StudySummaryInfoViewModel[]);
    }

    /**
     * 获取所有的课题信息,支持排序,过滤等
     * @param pageSize
     * @param pageNum
     * @param custName
     * @param deptName
     * @param studyName
     * @param Ascend
     */
    getStudyPageInfo(pageSize: number,
        pageNum: number,
        custName = '',
        deptName = '',
        studyName = '',
        Ascend = false,
        IsCust = true) {
        return this.httpHelper
            .get(`/mappings/studybreifinfo?pageSize=${pageSize}&pageNum=${pageNum}&custName=${
            encodeURIComponent(custName)}&deptName=${encodeURIComponent(deptName)}&studyName=${
            encodeURIComponent(studyName)}&Ascend=${Ascend}&IsCust=${IsCust}`)
            .map(rep => rep as server.StudyBriefInfoPaganitionViewModel);
    }

    /**
     * 新加映射课题和标准
     * @param model
     */
    addMapping(standardId: number, studyids: Array<number>) {
        return this.httpHelper.post(`/mappings/${standardId}`, studyids)
            .map(rep => rep as server.StudySummaryInfoViewModel[]);
    }

    /**
     * 更新一个映射关系
     * @param mappingID
     * @param model
     */
    updateMapping(mappingID: number, model: server.StudySummaryInfoViewModel) {
        return this.httpHelper.put(`/mappings/${mappingID}`, model)
            .map(rep => rep as server.StudySummaryInfoViewModel);
    }

    /**
     * 删除一个映射
     * @param mappingID
     */
    deleteMapping(mappingID: number) {
        return this.httpHelper.delete(`/mappings/${mappingID}`);
    }

    /**
     * 获取匹配页面的左侧树——源数据
     */
    getSourceDataTree(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/studyfields`);
    }

    /**
     * 获取匹配页面的右侧树——目标数据
     */
    getTargetDataTree(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/standardfields`);
    }

    /**
     * 获取某个课题的所有状态GET
     */
    getAllTaskStatus(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}`)
            .map(rep => rep as server.StudySummaryInfoViewModel);
    }

    /**
     * 获取某个课题的所有映射分组GET
     */
    getAllSections(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/sections`);
    }

    /**
     * 创建某个课题的映射分组POST
     */
    createSection(mappingID: number) {
        return this.httpHelper.post(`/mappings/${mappingID}/sections`);
    }

    /**
     * 指定目标表：更新某个课题的映射分组PUT
     */
    updateSection(mappingID: number,
        MappingSectionID: number,
        sectionEntity: server.StudyStandardMappingSectionViewModel) {
        return this.httpHelper.put(`/mappings/${mappingID}/sections/${MappingSectionID}`, sectionEntity)
            .map(rep => rep as server.StudyStandardMappingSectionViewModel);
    }

    /**
     * 创建映射分组的Rules
     */
    createRulesOfSection(mappingID: number,
        MappingSectionID: number,
        ruleDetail: server.StudyStandardMappingRuleViewModel[]) {
        return this.httpHelper.post(`/mappings/${mappingID}/sections/${MappingSectionID}/rules`, ruleDetail)
            .map(rep => rep as server.StudyStandardMappingSectionViewModel);
    }

    /**
     * 更新某个Rule
     */
    updateRuleOfSection(mappingID: number,
        MappingSectionID: number,
        mappingRuleID: number,
        ruleDetail: server.StudyStandardMappingRuleViewModel) {
        return this.httpHelper.put(`/mappings/${mappingID}/sections/${MappingSectionID}/rules/${mappingRuleID}`,
            ruleDetail)
            .map(rep => rep as server.StudyStandardMappingRuleViewModel);
    }

    /**
     * 创建扩展变量POST
     */
    createExpandVariable(mappingID: number,
        MappingSectionID: number,
        mappingRuleID: number,
        standardID: number,
        destinationTableID: string,
        fieldName: string) {
        return this.httpHelper
            .post(`/mappings/${mappingID}/sections/${MappingSectionID}/rules/${mappingRuleID
            }/expandedfield?standardID=${standardID}&destinationTableID=${destinationTableID}&fieldName=${fieldName
            }`)
            .map(rep => rep as server.StudyStandardMappingRuleViewModel);
    }

    /**
     * 创建临时变量POST
     */
    createTempVariable(mappingID: number,
        MappingSectionID: number,
        mappingRuleID: number,
        standardID: number,
        destinationTableID: string,
        fieldName: string) {
        return this.httpHelper
            .post(`/mappings/${mappingID}/sections/${MappingSectionID}/rules/${mappingRuleID
            }/temporaryfield?standardID=${standardID}&destinationTableID=${destinationTableID}&fieldName=${fieldName
            }`)
            .map(rep => rep as server.StudyStandardMappingRuleViewModel);
    }

    /**
     * 显示多选变量的选项值POST
     */
    showMultipleValues(mappingID: number, MappingSectionID: number, mappingRuleID: number) {
        return this.httpHelper
            .post(`/mappings/${mappingID}/sections/${MappingSectionID}/fielditem?mappingRuleID=${mappingRuleID
            }`)
            .map(rep => rep as server.StudyStandardMappingRuleViewModel[]);
    }

    /**
     * 隐藏扩展变量DELETE
     */
    hideMultipleValues(mappingID: number, MappingSectionID: number, mappingRuleID: number) {
        return this.httpHelper
            .delete(`/mappings/${mappingID}/sections/${MappingSectionID}/fielditem?mappingRuleID=${mappingRuleID}`)
            .map(rep => rep.json());
    }

    /**
     * 删除某个课题的映射分组DELETE
     */
    deleteSection(mappingID: number, MappingSectionID: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/sections/${MappingSectionID}`).map((rep) => rep.json());
    }

    /**
     * 删除某个分组的某行DELETE
     */
    deleteSectionLine(mappingID: number, MappingSectionID: string, MappingRuleID: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/sections/${MappingSectionID}/rules/${MappingRuleID}`)
            .map((rep) => rep.json() as server.StudyStandardMappingSectionViewModel);
    }

    /**
     * 清空目标分组PUT
     */
    deleteSectionTarget(mappingID: number, MappingSectionID: string) {
        return this.httpHelper.put(`/mappings/${mappingID}/sections/${MappingSectionID}/emptydestination`)
            .map(rep => rep as server.StudyStandardMappingSectionViewModel);
    }

    /**
     * 自动匹配PUT
     */
    autoMapping(mappingID: number, MappingSectionID: string) {
        return this.httpHelper.put(`/mappings/${mappingID}/sections/${MappingSectionID}/automap`)
            .map(rep => rep as server.StudyStandardMappingSectionViewModel);
    }

    /**
     * 提交映射PUT
     */
    submitMappings(mappingID: number) {
        return this.httpHelper.put(`/mappings/${mappingID}/submit`).map(rep => rep);
    }

    /**
     * 更新数据PUT /mappings/{mappingID}/update
     */
    updateMappings(mappingID: number) {
        return this.httpHelper.put(`/mappings/${mappingID}/update`).map(rep => rep);
    }

    /**
     * 获取临时表数据GET
     */
    getTempTables(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/temporary`).map(rep => rep);
    }

    /**
     * 创建临时表POST
     */
    createTempTable(mappingID: number) {
        return this.httpHelper.post(`/mappings/${mappingID}/temporary`)
            .map(rep => rep as server.TempororyTableViewModel);
    }

    /** 
     * 更新临时表PUT
     */
    updateTempTable(mappingID: number, tempTableID: number, tableDetail: server.TempororyTableViewModel) {
        return this.httpHelper.put(`/mappings/${mappingID}/temporary/${tempTableID}`, tableDetail)
            .map(rep => rep as server.TempororyTableViewModel);
    }

    /**
     * 删除临时表DELETE
     */
    deleteTempTable(mappingID: number, tempTableID: number) {
        return this.httpHelper.delete(`/mappings/${mappingID}/temporary/${tempTableID}`).map((rep) => rep.json());
    }

    /**
    * 创建临时表分组POST
    */
    createTempGroup(mappingID: number, tempTableID: number) {
        return this.httpHelper.post(`/mappings/${mappingID}/temporary/${tempTableID}/temporarysection`)
            .map(rep => rep as server.TempororyTableSectionViewModel);
    }

    /**
    * 删除临时表分组DELETE
    */
    deleteTempGroup(mappingID: number, tempTableID: number, tempororyTableSectionID: number) {
        return this.httpHelper
            .delete(`/mappings/${mappingID}/temporary/${tempTableID}/temporarysection/${tempororyTableSectionID}`)
            .map((rep) => rep.json());
    }

    /**
    * 创建临时表的字段POST
    */
    creatTempGroupVariables(mappingID: number,
        tempTableID: number,
        tempororyTableSectionID: number,
        fieldDetails: server.TempororyTableFieldViewModel[]) {
        return this.httpHelper
            .post(`/mappings/${mappingID}/temporary/${tempTableID}/temporarysection/${tempororyTableSectionID
            }/temporaryfield`,
            fieldDetails)
            .map(rep => rep as server.TempororyTableSectionViewModel);
    }

    /**
    * 删除临时表的字段和分组中的表名DELETE
    */
    deleteTempGroupVariable(mappingID: number,
        tempTableID: number,
        tempororyTableSectionID: number,
        tempororyTableFieldID: string,
        isHead: boolean) {
        return this.httpHelper
            .delete(`/mappings/${mappingID}/temporary/${tempTableID}/temporarysection/${tempororyTableSectionID
            }/temporaryfield/${tempororyTableFieldID}?isHead=${isHead}`)
            .map((rep) => rep.json() as server.TempororyTableViewModel);
    }

    /**
     * 获取源数据筛选处的课题字段树
     * @param mappingID
     */
    getFilterStudyField(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/filterstudyfields`)
            .map(rep => rep as server.StudyFieldInfoTreeViewModel);
    }

    /**
     * 获取section的筛选器信息
     * @param mappingID
     * @param mappingSectionID
     */
    getSectionFilter(mappingID: number, mappingSectionID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/sections/${mappingSectionID}/filter`)
            .map(rep => rep as server.FilterViewModel);
    }

    /**
     * 
     * @param mappingID
     * @param tempororyTableID
     * @param tempororyTableSectionID
     */
    getTemporaryFilter(mappingID: number, tempororyTableID: number, tempororyTableSectionID: number) {
        return this.httpHelper
            .get(`/mappings/${mappingID}/temporary/${tempororyTableID}/temporarysection/${tempororyTableSectionID}/filter`)
            .map(rep => rep as server.FilterViewModel);
    }

    /**
     * 更新section的筛选器信息
     * @param mappingID
     * @param mappingSectionID
     * @param filterModel
     */
    updateSectionFilter(mappingID: number, mappingSectionID: number, filterModel: server.FilterViewModel) {
        return this.httpHelper.put(`/mappings/${mappingID}/sections/${mappingSectionID}/filter`, filterModel)
            .map(rep => rep as server.FilterViewModel);
    }

    /**
     * 更新一个临时表中数据源筛选的信息
     * @param mappingID
     * @param tempororyTableID
     * @param tempororyTableSectionID
     */
    updateTemporaryFilter(mappingID: number, tempororyTableID: number, tempororyTableSectionID: number, filterModel: server.FilterViewModel) {
        return this.httpHelper
            .put(`/mappings/${mappingID}/temporary/${tempororyTableID}/temporarysection/${tempororyTableSectionID
            }/filter`,
            filterModel);
    }

    /**
     * 得到字段的值的集合
     * @param mappingID
     * @param mappingSectionID
     */
    getFieldItems(mappingID: number, mappingSectionID: number, fieldID: string) {
        return this.httpHelper
            .get(`/mappings/${mappingID}/sections/${mappingSectionID}/filter/fielditem?fieldID=${fieldID}`)
            .map(rep => rep as string[]);
    }

    /*选项值映射 --- 开始*/

    /**
     * 获取选项值映射信息
     * @param mappingID
     */
    getOptionMapping(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/optionmapping`)
            .map(rep => rep as server.OptionMappingViewModel);
    }

    /**
     * 提交某个选项值映射信息
     * @param mappingID
     */
    updateOptionMapping(mappingID: number) {
        return this.httpHelper.put(`/mappings/${mappingID}/optionmapping`);
    }

    /**
     * 获取某个标准字段的选项值映射信息
     * @param mappingID
     * @param FieldID
     */
    getFieldOptionMapping(mappingID: number, FieldID: string) {
        return this.httpHelper.get(`/mappings/${mappingID}/optionmapping/${FieldID}`)
            .map(rep => rep as server.SourceOptionMapping);
    }

    /**
     * 保存某个标准字段的信息
     * @param mappingID
     * @param FieldID
     */
    updateFieldOptionMapping(mappingID: number, FieldID: string) {
        return this.httpHelper.put(`/mappings/${mappingID}/optionmapping/${FieldID}`);
    }

    /**
     * 提交某个映射的选项值信息
     * @param mappingID
     */
    submitOptionMapping(mappingID: number) {
        return this.httpHelper.put(`/mappings/${mappingID}/optionmapping`);
    }

    /**
     * 更新某个标准字段的选项值源值列表
     * @param mappingID
     * @param FieldID
     * @param searchCondition
     */
    //getFieldOptionList(mappingID: number, FieldID: string, searchCondition:string) {
    //    return this.httpHelper.get(`/mappings/${mappingID}/optionmapping/${FieldID}/${searchCondition}`);
    //}

    /**
     * 删除一个选项值映射映射
     * @param mappingID
     * @param FieldID
     * @param OptionName
     * @param ValueName
     */
    deleteFieldValueOptionMapping(mappingID: number, FieldID: string, OptionName: string, ValueName: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/optionmapping/${FieldID}/${OptionName}/${ValueName}`);
    }

    /**
     * 更新某个标准字段的选项值源值列表
     * @param mappingID
     * @param FieldID
     * @param OptionName
     * @param ValueName
     */
    updateFieldValueOptionMapping(mappingID: number, FieldID: string, OptionName: string, ValueNames: Array<string>) {
        return this.httpHelper.post(`/mappings/${mappingID}/optionmapping/${FieldID}/${OptionName}`, ValueNames)
            .map(rep => rep as server.SourceOptionMapping);
    }

    /**
     * 删除一个放弃中的源值
     * @param mappingID
     * @param FieldID
     * @param DiscardSourceValueName
     */
    deleteDiscardFieldValueOptionMapping(mappingID: number, FieldID: string, DiscardSourceValueName: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/optionmapping/${FieldID}/discardsourcevalues/${DiscardSourceValueName}`);
    }

    /**
     * 更新某个标准字段的放弃源值列表
     * @param mappingID
     * @param FieldID
     * @param ValueNames
     */
    updateDiscardFieldValueOptionMapping(mappingID: number, FieldID: string, ValueNames: Array<string>) {
        return this.httpHelper.post(`/mappings/${mappingID}/optionmapping/${FieldID}/discardsource`, ValueNames)
            .map(rep => rep as server.SourceOptionMapping);
    }

    /**
     * 清空一个选项值的所有映射
     * @param mappingID
     * @param FieldID
     * @param OptionName
     */
    emptyFieldValueOptionMapping(mappingID: number, FieldID: string, OptionName: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/optionmapping/${FieldID}/${OptionName}`);
    }

    /**
     * 清空放弃中的源值
     * @param mappingID
     * @param FieldID
     */
    emptyDiscardFieldValueOptionMapping(mappingID: number, FieldID: string) {
        return this.httpHelper.delete(`/mappings/${mappingID}/optionmapping/${FieldID}/discardsourcevalues`);
    }

    /**
     * 获取关联表域信息
     * @param mappingID
     */
    getAssociateTableDomain(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/AssociativeDomains`)
            .map(rep => rep as server.AssociateTableDomainViewModel[]);
    }

    /**
     * 获取关联表设置信息
     * @param mappingID
     */
    getAssociations(mappingID: number) {
        return this.httpHelper.get(`/mappings/${mappingID}/Associations`)
            .map(rep => rep as server.AssociateMappingViewModel[]);
    }

    /**
     * 创建一条关联信息
     * @param mappingID
     * @param associationDetail
     */
    addAssociations(mappingID: number, associationDetail: server.AssociateMappingViewModel) {
        return this.httpHelper.post(`/mappings/{mappingID}/Associations`, associationDetail)
            .map(rep => rep as server.AssociateMappingViewModel);
    }

    /**
     * 修改一条关联信息
     * @param mappingID
     * @param associationID
     * @param associationDetail
     */
    updateAssociations(mappingID: number, associationID: number, associationDetail: server.AssociateMappingViewModel) {
        return this.httpHelper.post(`/mappings/{mappingID}/Associations/${associationID}`, associationDetail)
            .map(rep => rep as server.AssociateMappingViewModel);
    }

    /**
     * 删除一条关联信息
     * @param mappingID
     * @param associationID
     */
    deleteAssociations(mappingID: number, associationID: number) {
        return this.httpHelper.delete(`/mappings/{mappingID}/Associations/${associationID}`);
    }

    /*选项值映射 --- 结束*/
}