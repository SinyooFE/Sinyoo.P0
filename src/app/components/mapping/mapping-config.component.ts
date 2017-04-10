
import { Component, OnInit, ViewContainerRef } from '@angular/core';

//弹框
import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize, Modal } from 'angular2-modal/plugins/bootstrap';

//分页
import { PaginationModule } from 'ng2-bootstrap/pagination';

import { StandardService,MappingService } from '../../services';

import { MappingStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class MappingConfigContext extends BSModalContext {
    /**
     * mapping信息,传入
     */
    mappingList: Array<server.StandardStudyViewModel>;
}

@Component({
    // moduleId: module.id,
    selector: 'mapping-config',
    styleUrls: ['mapping-config.component.css'],
    templateUrl: 'mapping-config.component.html'
})

export class MappingConfigComponent implements CloseGuard, OnInit, ModalComponent<MappingConfigContext>  {
    /**
     * 弹框传入的参数
     */
    context: MappingConfigContext;
    /**
     * 课题分页信息
     */
    studyBriefPageInfo = <server.StudyBriefInfoPaganitionViewModel>{ studyInfo: [] };
    /**
     * 分页课题信息选择信息
     * 0不存在于已映射的列表内 1待添加映射 2存在于映射列表内
     */
    studyBriefCheckedInfo = [];
    /**
     * 标准下拉框数据
     */
    standardList: Array<server.S_StandardCoypViewModel> = [];
    /**
     * 标准下的mapping课题信息
     */
    standardStudyInfo = <server.StandardStudyViewModel>{};
    /**
     * 查询参数
     */
    searchPara = { pageSize: 10, pageNum: 1, custName: '', deptName: '', studyName: '', Ascend: false, IsCust: true };

    //是否全选
    isSelectAll = false;
    //枚举
    enumMappingStatus = MappingStatus;

    constructor(public dialog: DialogRef<MappingConfigContext>,
        private standardService: StandardService,
        private mappingService: MappingService,
        private modal: Modal) {
        dialog.context.dialogClass = 'modal-dialog mapping-modal-dialog';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);
        this.context = dialog.context;
    }

    ngOnInit(): void {
        this.getStudyBriefPageInfo();

        //标准列表从首页面传入，包含所有的mapping信息，不需要再次获取
        if (this.context.mappingList.length > 0) {
            //标准列表
            this.context.mappingList.forEach((value, index, array) => {
                this.standardList.push(<server.S_StandardCoypViewModel>{
                    ID: value.StandardID,
                    StandardName: value.StandardName
                });
            });
            //设置当前标准为数据第一项
            this.changeCurrentStandard(this.standardList[0].ID);
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
     * 确认
     */
    ok() {

    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }

    /**
     * 全选
     */
    selectAllStudy(isChecked: boolean) {
        this.isSelectAll = isChecked;
        this.studyBriefCheckedInfo.forEach((value, index, array) => {
            if (value !== 2) {
                array[index] = (isChecked ? 1 : 0);
            }
        });
    }

    /**
     * 添加映射
     */
    addMapping() {
        let checkArray = [];
        _.each(this.studyBriefPageInfo.studyInfo, (item, index) => {
            if (this.studyBriefCheckedInfo[index] === 1) {
                checkArray.push(item.Study_id);
            }
        });

        if (checkArray.length === 0) {
            this.modal.alert()
                .title('警告')
                .message('请先选择课题！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.modal.confirm()
            .title('提示')
            .message('确定添加吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        //批量添加
                        this.mappingService.addMapping(this.standardStudyInfo.StandardID, checkArray)
                            .subscribe((data: Array<server.StudySummaryInfoViewModel>) => {
                                if (!_.isNil(data) && data.length > 0) {
                                    data.forEach((value,index,array) => {
                                        this.standardStudyInfo.StudyInfos.push(value);
                                    });
                                    this.initStudyBriefCheckedInfo();
                                    this.showAlert('添加成功！');
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 删除映射
     * @param mappingId
     */
    deleteMapping(mappingId: number) {
        this.modal.confirm()
            .title('提示')
            .message('确定要删除吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.mappingService.deleteMapping(mappingId)
                            .subscribe((data) => {
                                //移除数组
                                _.remove(this.standardStudyInfo.StudyInfos,
                                    (item) => {
                                        return item.ID === mappingId;
                                    });
                                this.initStudyBriefCheckedInfo();
                                //this.showAlert('删除成功！');
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 隐藏映射
     * @param mappingId
     */
    hideMapping(mappingId: number, isHiding: boolean) {
        this.mappingService.updateMapping(mappingId, <server.StudySummaryInfoViewModel>{ IsHiding: !isHiding })
            .subscribe((data) => {
                //更新数组
                let tempIndex = _.findIndex(this.standardStudyInfo.StudyInfos,
                    (item) => {
                        return item.ID === mappingId;
                    });
                if (tempIndex > -1) {
                    this.standardStudyInfo.StudyInfos[tempIndex] = <server.StudySummaryInfoViewModel>data;
                }
            });
    }

    /**
     * 切换选择的标准
     * @param event
     */
    changeCurrentStandard(standardId: any) {
        if (isNaN(standardId)) return;

        //获取mapping课题信息
        let tempMapping = _.find(this.context.mappingList, (item) => { return item.StandardID === parseInt(standardId) });
        if (!_.isNil(tempMapping)) {
            this.standardStudyInfo = tempMapping;
        } else {
            this.standardStudyInfo = <server.StandardStudyViewModel>{};
        }
        this.initStudyBriefCheckedInfo();
    }

    /**
     * 普通、高级模式切换
     */
    changeSearchLevel() {
        this.searchPara.IsCust = !this.searchPara.IsCust;
        this.searchPara.custName = '';
        this.searchPara.deptName = '';
        this.searchPara.studyName = '';
    }

    /**
     * 排序
     * @param Ascend
     */
    changeSearchSortType(Ascend: boolean) {
        this.searchPara.Ascend = Ascend;
        this.getStudyBriefPageInfo();
    }

    /**
     * 分页
     */
    changePage(pageSize, pageNum) {
        this.searchPara.pageSize = pageSize;
        this.searchPara.pageNum = pageNum;
        this.getStudyBriefPageInfo();
    }

    /**
     * 确定按钮点击事件
     */
    searchStudyInfo() {
        if (this.searchPara.pageNum === 1) {
            this.getStudyBriefPageInfo();
        } else {
            this.searchPara.pageNum = 1;
        }
    }

    /**
     * 课题分页信息
     * @param pageSize
     * @param pageIndex
     */
    getStudyBriefPageInfo() {
        this.mappingService.getStudyPageInfo(this.searchPara.pageSize, this.searchPara.pageNum,
            this.searchPara.custName, this.searchPara.deptName, this.searchPara.studyName,
            this.searchPara.Ascend, this.searchPara.IsCust)
            .subscribe((data) => {
                this.studyBriefPageInfo = data;
                this.initStudyBriefCheckedInfo();
            });
    }

    /**
     * 初始化当前页课题信息的选中信息
     */
    initStudyBriefCheckedInfo() {
        this.isSelectAll = false;
        this.studyBriefCheckedInfo = [];
        this.studyBriefPageInfo.studyInfo.forEach((value, index, array) => {
            let tempMapping = _.find(this.standardStudyInfo.StudyInfos, (item) => {
                return item.Study_id === value.Study_id;
            });
            this.studyBriefCheckedInfo.push(_.isNil(tempMapping) ? 0 : 2);
        });
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