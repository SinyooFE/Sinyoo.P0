/**
* 变量列表组件
*/
import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { Router } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { VariableEditorComponent } from './variable-editor.component';

import { StandardService, BaseService } from '../../services';

import { ApprovalStatus, DataStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'variable-list',
    styleUrls: ['variable-list.component.css'],
    templateUrl: 'variable-list.component.html'
})
export class VariableListComponent implements OnInit, OnDestroy {
    //所有的变量信息
    private allVairableList: server.S_FieldViewModel[];
    //搜索结果信息
    private vairableList: server.S_FieldViewModel[];
    private domainName: string;
    private currStandardId: number;
    private currDomainId: number;

    //搜索
    searchTerms = new Subject<string>();

    //排序
    @ViewChild('vairableListDiv') variableListDiv;

    //枚举
    enumApprovalStatus = ApprovalStatus;
    enumDataStatus = DataStatus;

    editorHeight = 0;

    constructor(private standardService: StandardService,
        private baseService: BaseService,
        private modal: Modal,
        private router: Router) {
    }

    ngOnInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 140;
            });

        //搜索
        this.searchTerms.debounceTime(500).distinctUntilChanged()
            .subscribe(
            (data) => {
                if (!_.isNil(data) && data !== '') {
                    this.vairableList = _.filter(this.allVairableList,
                        (item) => {
                            return (item.FieldName.indexOf(data) > -1 ||
                                item.FieldLabel.indexOf(data) > -1 ||
                                item.FieldLabelEn.indexOf(data) > -1);
                        });
                } else {
                    this.vairableList = this.allVairableList;
                }
            });
    }

    ngOnDestroy(): void { }

    sortVariable(isSort: boolean): void {
        //所有域的情况下不允许排序
        if (this.variableListDiv !== null) {
            let tempSortTable = $(this.variableListDiv.nativeElement).find('.variable_list_body').sortable('instance');

            //未初始化，且需要排序时
            if (_.isNil(tempSortTable) && isSort) {
                $(this.variableListDiv.nativeElement)
                    .find('.variable_list_body')
                    .sortable({
                        items: '.variable_list',
                        update: (event, ui) => {
                            //当前拖动对象
                            let tempVariableDetail = <server.S_FieldDetailViewModel>{
                                ID: +ui.item.data('id'),
                                Sort: +ui.item.data('sort')
                            };

                            //当前排序信息
                            let tempVariableDetailArray = [];
                            $(event.target)
                                .find('tr')
                                .each((index, item) => {
                                    tempVariableDetailArray.push({
                                        ID: +$(item).data('id'),
                                        Sort: +$(item).data('sort')
                                    });
                                });
                            //当前拖动对象的新下标
                            let tempStandardDetailIndex = _.findIndex(tempVariableDetailArray,
                                (item) => {
                                    return item.ID === tempVariableDetail.ID;
                                });
                            //计算排序值
                            if (tempStandardDetailIndex > -1 &&
                                tempStandardDetailIndex < tempVariableDetailArray.length &&
                                tempVariableDetailArray.length > 1) {
                                if (tempStandardDetailIndex === 0) {
                                    tempVariableDetail.Sort = tempVariableDetailArray[tempStandardDetailIndex + 1].Sort / 2.0;
                                } else if (tempStandardDetailIndex === tempVariableDetailArray.length - 1) {
                                    tempVariableDetail.Sort = tempVariableDetailArray[tempStandardDetailIndex - 1].Sort + 10;
                                } else {
                                    tempVariableDetail.Sort = (tempVariableDetailArray[tempStandardDetailIndex + 1].Sort + tempVariableDetailArray[tempStandardDetailIndex - 1].Sort) / 2.0;
                                }
                            }
                            //更新排序
                            this.standardService
                                .saveVariableDetail(this.currStandardId, this.currDomainId, tempVariableDetail)
                                .subscribe((data) => {
                                    console.log(data);
                                    //排序vairableList
                                    let tempIndex = _.findIndex(this.vairableList,
                                        (item) => { return item.ID === tempVariableDetail.ID });
                                    if (tempIndex > -1 && tempIndex < this.vairableList.length) {
                                        this.vairableList[tempIndex].Sort = data.Sort;
                                        this.vairableList = _.sortBy(this.vairableList, (item) => { return item.Sort });
                                    }
                                    //排序allVairableList
                                    tempIndex = _.findIndex(this.allVairableList,
                                        (item) => { return item.ID === tempVariableDetail.ID });
                                    if (tempIndex > -1 && tempIndex < this.allVairableList.length) {
                                        this.allVairableList[tempIndex].Sort = data.Sort;
                                        this.allVairableList = _
                                            .sortBy(this.allVairableList, (item) => { return item.Sort });
                                    }
                                });
                        }
                    });
            }

            //已初始化，且不需要排序
            if (!_.isNil(tempSortTable) && !isSort) {
                $(this.variableListDiv.nativeElement)
                    .find('.variable_list_body').sortable('destroy');
            }
        }
    }

    /**
     * 更新域帐号
     * @param standardId
     * @param domainId
     */
    updateDomainId(standardId: number, domainId: number, domainName: string) {
        this.currStandardId = standardId;
        this.currDomainId = domainId;
        this.domainName = domainName;

        if (!_.isNil(this.currDomainId)) {
            //加载域下的变量
            this.standardService.getVairableList(standardId, domainId)
                .subscribe(
                (data) => {
                    this.vairableList = data;
                    this.allVairableList = data;
                    //设置排序
                    this.sortVariable(true);
                });
        } else {
            //加载标准下的所有变量
            this.standardService.getVairableListForStandard(standardId)
                .subscribe(
                (data) => {
                    this.vairableList = data;
                    this.allVairableList = data;
                    //禁止排序
                    this.sortVariable(false);
                });
        }
    }

    /**
     * 删除变量
     * @param variableId
     */
    deleteVariable(variableId: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要删除此变量吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.deleteVariable(this.currStandardId, this.currDomainId, variableId)
                            .subscribe((data) => {
                                if (data.IsDeleted) {
                                    _.remove(this.vairableList,
                                        (item) => {
                                            return item.ID === variableId;
                                        });
                                    _.remove(this.allVairableList,
                                        (item) => {
                                            return item.ID === variableId;
                                        });
                                } else {
                                    let tempVariable = _.find(this.vairableList, (item) => { return item.ID === variableId });
                                    if (!_.isNil(tempVariable)) {
                                        tempVariable.DataStatus = data.Status;
                                        tempVariable.ApprovedStatus = data.ApprovedStatus;
                                    }
                                    tempVariable = _.find(this.allVairableList, (item) => { return item.ID === variableId });
                                    if (!_.isNil(tempVariable)) {
                                        tempVariable.DataStatus = data.Status;
                                        tempVariable.ApprovedStatus = data.ApprovedStatus;
                                    }
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 取消删除
     */
    undoDeleteVariable(variableId: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要取消删除此变量吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.undoDeleteVariable(this.currStandardId, this.currDomainId, variableId)
                            .subscribe((data) => {
                                let tempVariable = _.find(this.vairableList, (item) => { return item.ID === variableId });
                                if (!_.isNil(tempVariable)) {
                                    tempVariable.DataStatus = data.Status;
                                    tempVariable.ApprovedStatus = data.ApprovedStatus;
                                }
                                tempVariable = _.find(this.allVairableList, (item) => { return item.ID === variableId });
                                if (!_.isNil(tempVariable)) {
                                    tempVariable.DataStatus = data.Status;
                                    tempVariable.ApprovedStatus = data.ApprovedStatus;
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 编辑变量
     * @param variableId
     */
    editVariable(variableId: number) {
        this.router.navigate([`/standard/variableedit/${this.currStandardId}/${this.currDomainId}/${variableId}`]);
    }

    /**
     * 搜索变量
     * @param filter
     */
    searchVariable(filter: string): void {
        this.searchTerms.next(filter);
    }

    /**
     * 状态标记
     * @param status
     */
    iconFontHtml(status: ApprovalStatus): string {
        let res = '';
        switch (status) {
            case ApprovalStatus.未提交:
                {
                    res = "&#xe617;";
                }; break;
            case ApprovalStatus.审核通过:
                {
                    res = "&#xe6a9;";
                }; break;
            case ApprovalStatus.审核未通过:
                {
                    res = "&#xe71d;";
                }; break;
            default:
                {
                    res = "&#xe868;";
                }; break;
        }
        return res;
    }
}