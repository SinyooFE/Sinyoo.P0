/**
*MappingMatch匹配页面    
*/
import { Component, OnInit, AfterViewInit, AfterViewChecked, ViewContainerRef, Inject, ViewChild } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { MappingService } from "../../services";

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { PageScrollService, PageScrollInstance } from 'ng2-page-scroll';
import { DOCUMENT } from '@angular/platform-browser';

import { MappingMatchFilterComponent, MappingMatchFilterContext } from './mapping-match-filter.component';
import {
    MappingFieldStatus,
    StudyFieldType,
    StandardFieldType,
    SourceMappingType,
    DestinationMappingType,
    DataFilterType
} from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    selector: "mapping-match-index",
    styleUrls: ["mapping-match-index.component.css"],
    templateUrl: "mapping-match-index.component.html"
})

export class MappingMatchIndexComponent implements OnInit, AfterViewInit, AfterViewChecked {
    Enum_mappingFieldStatus = MappingFieldStatus;
    Enum_StudyFieldType = StudyFieldType;
    Enum_StandardFieldType = StandardFieldType;
    //分组中源的状态：指定/取消指定
    Enum_SourceMappingType = SourceMappingType;
    //分组中目标的状态：放弃、扩展、临时
    Enum_DestinationMappingType = DestinationMappingType;
    //有更新，无筛选，有筛选
    Enum_DataFilterType = DataFilterType;
    //传递过来的科室ID
    mapping_id: number;
    //右侧树的标准ID
    standard_id: number;
    //课题名
    studyName: string;
    //左侧树数据
    left_tree_data;
    //zTree插件-左侧树对象
    treeObj_left;
    //标准名
    standardName: string;
    //右侧树数据
    right_tree_data;
    //zTree插件-右侧树对象
    treeObj_right;
    //左侧树关键字
    leftKeyWords: string;
    //右侧树关键字
    rightKeyWords: string;
    //右侧目标表表名节点数组
    desTableNodeData = [];
    //搜索表头关键字
    desTableNameKey: string = "";
    //是否显示表头搜索区域
    isShowSelectOption_flag = false;
    //匹配当前分组id
    thisGroupIndex: number;
    //被指定的表ID
    thisDesTableID;
    //被指定的当前的nodeData
    thisTableNodeData;
    //节点的数据
    nodeData;
    //所有映射分组数据
    allGroupData = [];
    //复制一份分组数据
    copy_allGroupData;
    //所有临时表数据
    allTempTablesData = [];
    //遍历左侧树的节点计数器-拖拽次数
    domNum_leftDrop = 0;
    //遍历右侧树的节点计数器-拖拽次数
    domNum_rihgDrop = 0;
    //状态变量
    mappingMatchStatus = {
        //左侧树未勾选"未映射"-未勾选
        is_left_tree_not_mapping: false,
        //右侧树勾选"未映射"-未勾选
        is_right_tree_not_mapping: false,
        //显示驳回分组-未勾选
        is_show_rejected_group: false
    }
    //树筛选-左
    searchTermsLeftTree = new Subject<string>();
    //树筛选-右
    searchTermsRightTree = new Subject<string>();
    //初始化 多选项是否显示的id
    isShowMulVals = false;
    thisRuleID: number = 0;
    //高亮显示行
    highLight_id;
    highLight_node;
    highLight_position;
    //此课题的状态标识
    taskStatus_isUpdate = false;
    //滚动
    @ViewChild('matches_tablesArea') container;
    tempTableIndex: number;
    //构造器
    constructor(private mapping_service: MappingService, private router: ActivatedRoute, private route: Router, private location: Location, private overlay: Overlay, private vcRef: ViewContainerRef, public modal: Modal,
        @Inject(DOCUMENT) private document: any,
        private pageScrollService: PageScrollService) {
        overlay.defaultViewContainer = vcRef;
        this.router.params.subscribe(urlParam => {
            this.mapping_id = urlParam["mappingid"];
        });
    }
    //初始化
    ngOnInit(): void {
        //获取此课题的所有状态
        this.mapping_service.getAllTaskStatus(this.mapping_id)
            .subscribe(data => {
                //是否处于更新数据
                this.taskStatus_isUpdate = data.IsUpdating;
                console.log("是否处于更新：" + this.taskStatus_isUpdate);
            });
        //获取左侧树的数据-源数据
        this.mapping_service.getSourceDataTree(this.mapping_id)
            .subscribe(data => {
                this.studyName = data.Studyname;
                //获取树数据
                this.left_tree_data = data.Fields;
                //渲染左侧树
                this.renderTree($("#source_tree"), this.left_tree_data);
                //获取左侧树的zTree对象
                this.treeObj_left = $.fn.zTree.getZTreeObj("source_tree");
                //可以拖放
                this.madeDrag_Drop();
                //绑定节点点击事件
                this.getSpecialGroupByNumber();
            });

        //获取右侧树的数据-目标数据
        this.mapping_service.getTargetDataTree(this.mapping_id)
            .subscribe(data => {
                this.standardName = data.StandardName;
                //获取standard_id
                this.standard_id = data.StandardID;
                //获取树数据
                this.right_tree_data = data.Fields;
                //渲染右侧树
                this.renderTree($("#target_tree"), this.right_tree_data);
                //获取右侧树的zTree对象
                this.treeObj_right = $.fn.zTree.getZTreeObj("target_tree");
                //获取所有右侧树的表节点数据数组
                this.desTableNodeData = this.treeObj_right.getNodesByParam("FieldType", 1);
            });

        //获取所有分组
        this.mapping_service.getAllSections(this.mapping_id)
            .subscribe(data => {
                console.log(data);
                this.allGroupData = data;
                this.copy_allGroupData = data;
                this.madeDrag_Drop();
            });
        //获取所有临时表数据
        this.mapping_service.getTempTables(this.mapping_id)
            .subscribe(data => {
                this.allTempTablesData = data;
            });
    }
    ngAfterViewInit(): void {
        //搜索-左
        this.searchTermsLeftTree.debounceTime(1000).distinctUntilChanged()
            .subscribe(
            (data) => {
                if (!_.isNil(this.treeObj_left)) {
                    if (data === '') {
                        //收起树节点
                        this.treeObj_left.expandAll(false);
                        //所有隐蔽的节点显示出来
                        let hiddenNodes = this.treeObj_left.getNodesByParam('isHidden', true);
                        this.treeObj_left.showNodes(hiddenNodes);
                    } else {
                        //isSingle = true 返回 第一个找到的节点数据 JSON，无结果时返回 null
                        //isSingle = false 返回 节点数据集合 Array(JSON) ，无结果时返回[]
                        let searchNodes = this.treeObj_left.getNodesByFilter((node) => {
                            //返回所有需要显示的节点
                            if ((node.FieldType === StudyFieldType.普通字段 || node.FieldType === StudyFieldType.多选字段) && node.FieldName.indexOf(data) > -1) {
                                if (node.isHidden) {
                                    this.treeObj_left.showNode(node);
                                }
                                return true;
                            } else {
                                if (!node.isHidden) {
                                    this.treeObj_left.hideNode(node);
                                }
                                return false;
                            }
                        }, false);
                        //根据查找出来的节点，找出路径并全部显示
                        searchNodes.forEach((node, index, array) => {
                            if (node.isFirstNode) {
                                let path = node.getPath(node);
                                if (path.length > 0) {
                                    this.treeObj_left.showNodes(path);
                                }
                            }
                        });
                        //最后全部展开树节点
                        this.treeObj_left.expandAll(true);
                    }
                }
            });
        this.searchTermsRightTree.debounceTime(1000).distinctUntilChanged()
            .subscribe(
            (data) => {
                if (!_.isNil(this.treeObj_right)) {
                    if (data === '') {
                        //收起树节点
                        this.treeObj_right.expandAll(false);
                        //所有隐蔽的节点显示出来
                        let hiddenNodes = this.treeObj_right.getNodesByParam('isHidden', true);
                        this.treeObj_right.showNodes(hiddenNodes);
                    } else {
                        //isSingle = true 返回 第一个找到的节点数据 JSON，无结果时返回 null
                        //isSingle = false 返回 节点数据集合 Array(JSON) ，无结果时返回[]
                        let searchNodes = this.treeObj_right.getNodesByFilter((node) => {
                            //返回所有需要显示的节点
                            if ((node.FieldType === StandardFieldType.普通变量 || node.FieldType === StandardFieldType.域) && node.FieldName.indexOf(data) > -1) {
                                if (node.isHidden) {
                                    this.treeObj_right.showNode(node);
                                }
                                return true;
                            } else {
                                if (!node.isHidden) {
                                    this.treeObj_right.hideNode(node);
                                }
                                return false;
                            }
                        }, false);
                        //根据查找出来的节点，找出路径并全部显示
                        searchNodes.forEach((node, index, array) => {
                            if (node.isFirstNode) {
                                let path = node.getPath(node);
                                if (path.length > 0) {
                                    this.treeObj_right.showNodes(path);
                                }
                            }
                        });
                        //最后全部展开树节点
                        this.treeObj_right.expandAll(true);
                    }
                }
            });
    }
    ngAfterViewChecked() {
        //绑定高亮行
        this.hightLight(this.highLight_id, this.highLight_node, this.highLight_position);
        //再次绑定drop事件
        this.madeDrag_Drop();
    }
    //返回上一级按钮
    getBack() {
        this.location.back();
    }
    /*-----------------------------------------状态切换方法--------------------------------------------*/
    //未映射勾选函数
    noMappingFilterArithmetic(treeObj, checked: boolean, position: string) {
        let mappingNodes;

        if (checked) {
            treeObj.expandAll(true);
            //执行过滤，隐藏Mapping次数大于0的节点
            let mappingNodes = treeObj.getNodesByFilter(nodeData => {
                if ($("#" + nodeData.tId + "_a").find(".mappingMatch_TimesTip").text() !== "0") {
                    return true;
                }
            }, false);
            treeObj.hideNodes(mappingNodes);
        }
        else {
            treeObj.expandAll(false);
            let mappingNodes = treeObj.getNodesByFilter(nodeData => {
                return true;

            }, false);
            treeObj.showNodes(mappingNodes);
        }
    }
    //左侧树是否显示“未映射”变量
    isCheckedNotMappingOption(status: boolean, positionStr: string) {
        //若为左侧树
        if (positionStr === "position_leftTree") {
            this.mappingMatchStatus.is_left_tree_not_mapping = !status;
            this.noMappingFilterArithmetic(this.treeObj_left, this.mappingMatchStatus.is_left_tree_not_mapping, positionStr)
        }
        //若为右侧树
        else if (positionStr === "position_rightTree") {
            //修改左侧树状态
            this.mappingMatchStatus.is_right_tree_not_mapping = !status;
            this.noMappingFilterArithmetic(this.treeObj_right, this.mappingMatchStatus.is_right_tree_not_mapping, positionStr)
        }
    }
    //是否显示驳回分组
    switchRejectedGroupStatus(status: boolean) {
        this.mappingMatchStatus.is_show_rejected_group = !status;
    }
    //指定表头
    getThisTableNodeData(nodeId, groupIndex) {
        console.log("获取表头");
        this.thisTableNodeData = this.treeObj_right.getNodeByParam("FieldID", nodeId);
        this.allGroupData[groupIndex].DestinationTableID = nodeId;
        this.allGroupData[groupIndex].DestinationTableName = this.thisTableNodeData.FieldName;
    }
    //后悔，更换表头
    changeDesTableName(perGroup) {
        perGroup.DestinationTableName = "";
        perGroup.DestinationTableID = "";
    }
    //显示下拉菜单
    isShowSelectOption(flag: boolean, groupIndex) {
        this.desTableNodeData = this.treeObj_right.getNodesByParam("FieldType", 1);
        this.thisGroupIndex = groupIndex;
        this.isShowSelectOption_flag = !flag;
    }
    //搜索目标表头
    searchDesTableName(desTableNameKey) {
        this.desTableNodeData = this.treeObj_right.getNodesByParam("FieldType", 1);
        let searchTableName = [];
        if (desTableNameKey.trim() !== "") {
            searchTableName = _.filter(this.desTableNodeData, (item) => {
                if (item.FieldName.indexOf(desTableNameKey.trim()) !== -1) {
                    return true;
                }
            });
            if (searchTableName.length > 0) {
                this.desTableNodeData = searchTableName;
            }
            else {
                this.desTableNodeData = [];
            }
        }
        else {
            this.desTableNodeData = this.treeObj_right.getNodesByParam("FieldType", 1);
        }
    }
    //点击下拉option,更新分组
    selectTableName(tabName: string, tabId: string, groupData) {
        groupData.DestinationTableID = tabId;
        groupData.DestinationTableName = tabName;
        this.isShowSelectOption_flag = false;
        this.mapping_service.updateSection(this.mapping_id, groupData.MappingSectionID, groupData)
            .subscribe(data => {
                groupData = data;
            });
    }
    //指定/取消指定
    switch_Assign(thisRule) {
        console.log("进入指定");
        thisRule.SourceMappingType = thisRule.SourceMappingType === this.Enum_SourceMappingType.无 ? this.Enum_SourceMappingType.指定 : this.Enum_SourceMappingType.无;
    }
    //放弃/取消放弃
    switch_GiveUp(thisRule, groupIndex) {
        //切换
        thisRule.DestinationMappingType = thisRule.DestinationMappingType === this.Enum_DestinationMappingType.无 ? this.Enum_DestinationMappingType.放弃 : this.Enum_DestinationMappingType.无;
        if (thisRule.DestinationMappingType === this.Enum_DestinationMappingType.放弃) {
            this.mapping_service.updateRuleOfSection(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID, thisRule)
                .subscribe(data => {
                    this.allGroupData[groupIndex] = data;
                });
        }
        else if (thisRule.DestinationMappingType === this.Enum_DestinationMappingType.无) {
            this.mapping_service.updateRuleOfSection(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID, thisRule)
                .subscribe(data => {
                    this.allGroupData[groupIndex] = data;
                });
        }
    }
    //扩展/取消扩展
    switch_Extends(thisRule, thisGroup) {
        if (thisGroup.DestinationTableID === "") {
            alert("右侧无目标表,无法扩展变量！");
        }
        else {
            thisRule.DestinationMappingType = thisRule.DestinationMappingType === this.Enum_DestinationMappingType.无 ? this.Enum_DestinationMappingType.扩展 : this.Enum_DestinationMappingType.无;
        }
    }
    //临时/取消临时
    switch_Temp(thisRule, thisGroup) {
        if (thisGroup.DestinationTableID === "") {
            alert("右侧无目标表,无法创建临时变量！");
        }
        else {
            thisRule.DestinationMappingType = thisRule.DestinationMappingType === this.Enum_DestinationMappingType.无 ? this.Enum_DestinationMappingType.临时 : this.Enum_DestinationMappingType.无;
        }
    }
    //编辑目标变量
    editVariable(thisRule) {
        thisRule.isEdit = !thisRule.isEdit;
    }
    //提交编辑的变量
    submitEditedVariable(value, thisRuleData, groupIndex) {
        console.log("触发enter");
        if (value.trim() !== "") {
            let relValue = value.trim();
            thisRuleData.DestinationFieldName = relValue;
            this.mapping_service.updateRuleOfSection(this.mapping_id, thisRuleData.MappingSectionID, thisRuleData.MappingRuleID, thisRuleData)
                .subscribe(data => {
                    this.allGroupData[groupIndex] = data;
                    thisRuleData.isEdit = !thisRuleData.isEdit;
                    //修改对应树的节点
                    console.log(thisRuleData.DestinationFieldID);
                    let treeNode = this.treeObj_right.getNodeByParam("FieldID", thisRuleData.DestinationFieldID);
                    console.log(treeNode);
                    $("#" + treeNode.tId + "_span").text(relValue);
                });
        }
        else {
            alert("变量不能为空！");
        }
    }
    /*-----------------------------------------左右树的方法--------------------------------------------*/
    //左右树搜索
    searchTreeField(position: string, searchKey: string) {
        if (position === "left") {
            this.searchTermsLeftTree.next(searchKey);
        }
        else {
            this.searchTermsRightTree.next(searchKey);
        }
    }
    //点击计数器，显示相应的分组，并高亮显示行
    getSpecialGroupByNumber() {
        $("body").on("click", ".mappingMatch_TimesTip", (event) => {
            //过滤后的数据
            let new_allGroupData = [];
            //获取li的id（tId）
            let li_id = $(event.target.parentNode.parentNode).attr("id");
            //节点对象
            //let thisNodeData;
            //如果是左边节点
            if (li_id.indexOf("source_tree") > -1) {
                //传入li标签的id获取节点数据 
                //thisNodeData = this.treeObj_left.getNodeByTId(li_id);
                this.highLight_node = this.treeObj_left.getNodeByTId(li_id);
                this.highLight_id = this.highLight_node.FieldID;
                this.highLight_position = "left";
                for (let i = 0; i < this.copy_allGroupData.length; i++) {
                    for (let j = 0; j < this.copy_allGroupData[i].Tables.length; j++) {
                        for (let k = 0; k < this.copy_allGroupData[i].Tables[j].Rules.length; k++) {
                            if (this.copy_allGroupData[i].Tables[j].Rules[k].SourceFieldID === this.highLight_node.FieldID) {
                                new_allGroupData.push(this.copy_allGroupData[i]);
                                $("tr").removeClass("highLightTr");
                                //$("tr[sourceVarID='" + thisNodeData.FieldID + "']").addClass("highLightTr");
                            }
                        }
                    }
                }
            }
            //如果是右边节点
            else {
                //传入li标签的id获取节点数据 DestinationFieldID
                this.highLight_node = this.treeObj_right.getNodeByTId(li_id);
                this.highLight_id = this.highLight_node.FieldID;
                this.highLight_position = "right";
                for (let i = 0; i < this.copy_allGroupData.length; i++) {
                    for (let j = 0; j < this.copy_allGroupData[i].Tables.length; j++) {
                        for (let k = 0; k < this.copy_allGroupData[i].Tables[j].Rules.length; k++) {
                            if (this.copy_allGroupData[i].Tables[j].Rules[k].DestinationFieldID === this.highLight_node.FieldID) {
                                new_allGroupData.push(this.copy_allGroupData[i]);
                                $("tr").removeClass("highLightTr");
                                //$("tr[desVarID='" + thisNodeData.FieldID + "']").addClass("highLightTr");
                            }
                        }
                    }
                }
            }
            if (new_allGroupData.length > 0) {
                this.allGroupData = new_allGroupData;
            }
        });
    };
    hightLight(id: string, nodeData, position: string) {
        if (id !== "") {
            if (position === "left") {
                $("tr[sourceVarID='" + id + "']").addClass("highLightTr");
            }
            else {
                $("tr[desVarID='" + id + "']").addClass("highLightTr");
            }
        }
    }
    //点击临时表，锚点定位
    anchorTempTable(event, tempTableId: string) {
        //滚动,找到id为：tempTable_xxxxxx
        let pageScrollInstance: PageScrollInstance = PageScrollInstance
            .simpleInlineInstance(this.document,
            `#tempTable_${tempTableId}`,
            this.container.nativeElement);
        this.pageScrollService.start(pageScrollInstance);
    }
    /*-----------------------------------------分组的方法--------------------------------------------*/
    //创建一个分组
    createGroup() {
        this.mapping_service.createSection(this.mapping_id)
            .subscribe(data => {
                //添加一个数组到总数据中
                this.allGroupData.push(data);
            });
    }
    //自动匹配
    autoMappingSection(sectionId, groupIndex) {
        this.mapping_service.autoMapping(this.mapping_id, sectionId)
            .subscribe(data => {
                this.allGroupData[groupIndex] = data;
            });
    }
    //计数器方法+1、-1
    countNum(nodeDOM, num: number) {
        let count_dom = nodeDOM.find(".mappingMatch_TimesTip");
        let mappingNum: number;
        //计数器+1
        if (num > 0) {
            if (parseInt(count_dom.text()) === 0) {
                count_dom.removeClass("mappingMatch_TimesTipHide");
            }
            mappingNum = parseInt(count_dom.text()) + 1;
            count_dom.text(mappingNum);
        }
        //计数器-1
        else {
            if (parseInt(count_dom.text()) > 0) {
                mappingNum = parseInt(count_dom.text()) - 1;
                count_dom.text(mappingNum)
                //如果为0，隐藏
                if (mappingNum === 0) {
                    count_dom.addClass("mappingMatch_TimesTipHide");
                }
            }
        }
    }
    //删除某个分组
    deleteGroup(startIndex, MappingSectionID) {
        let sourceId;
        let destinationId;
        let sourceNode;
        let targetNode;
        this.mapping_service.deleteSection(this.mapping_id, MappingSectionID)
            .subscribe(data => {
                //如果删除成功
                if (data.IsDeleted) {
                    //计数器-1
                    for (let i = 0; i < this.allGroupData[startIndex].Tables.length; i++) {
                        for (let j = 0; j < this.allGroupData[startIndex].Tables[i].Rules.length; j++) {
                            sourceId = this.allGroupData[startIndex].Tables[i].Rules[j].SourceFieldID;
                            destinationId = this.allGroupData[startIndex].Tables[i].Rules[j].DestinationFieldID;
                            if (sourceId !== "") {
                                sourceNode = this.treeObj_left.getNodeByParam("FieldID", sourceId);
                                this.countNum($("#" + sourceNode.tId + "_a"), -1);
                            }
                            if (destinationId !== "") {
                                targetNode = this.treeObj_right.getNodeByParam("FieldID", destinationId);
                                this.countNum($("#" + targetNode.tId + "_a"), -1);
                                if (this.allGroupData[startIndex].Tables[i].Rules[j].DestinationMappingType === this.Enum_DestinationMappingType.扩展 || this.allGroupData[startIndex].Tables[i].Rules[j].DestinationMappingType === this.Enum_DestinationMappingType.临时) {
                                    this.treeObj_right.removeNode(targetNode);
                                }

                            }
                            //针对右侧多选项值,如果有值
                            if (this.allGroupData[startIndex].Tables[i].Rules[j].OptionValues.length > 0) {
                                for (let k = 0; k < this.allGroupData[startIndex].Tables[i].Rules[j].OptionValues.length; k++) {
                                    destinationId = this.allGroupData[startIndex].Tables[i].Rules[j].OptionValues[k].DestinationFieldID;
                                    if (destinationId !== "") {
                                        targetNode = this.treeObj_right.getNodeByParam("FieldID", destinationId);
                                        this.countNum($("#" + targetNode.tId + "_a"), -1);
                                        if (this.allGroupData[startIndex].Tables[i].Rules[j].DestinationMappingType === this.Enum_DestinationMappingType.扩展 || this.allGroupData[startIndex].Tables[i].Rules[j].DestinationMappingType === this.Enum_DestinationMappingType.临时) {
                                            this.treeObj_right.removeNode(targetNode);
                                        }

                                    }

                                }
                            }
                        }
                    }
                    this.allGroupData.splice(startIndex, 1);
                }
            });
    }
    //删除变量
    deleteGroupVariable(groupIndex, tableIndex, ruleIndex, sectionID, ruleID, isMultuipleValue: boolean, multipleIndex: number) {
        let thisRule;
        let field_id;
        let deleteNodeData;
        let num_dom;
        //如果是右侧普通的变量
        if (!isMultuipleValue) {
            thisRule = this.allGroupData[groupIndex].Tables[tableIndex].Rules[ruleIndex];
        }
        //右侧多选变量
        else {
            thisRule = this.allGroupData[groupIndex].Tables[tableIndex].Rules[ruleIndex].OptionValues[multipleIndex];
        }
        //获取树节点
        field_id = thisRule.DestinationFieldID;
        deleteNodeData = this.treeObj_right.getNodeByParam("FieldID", field_id);
        //如果是扩展/临时的变量，还要删除相应的右侧树节点
        if (thisRule.DestinationMappingType === this.Enum_DestinationMappingType.临时 || thisRule.DestinationMappingType === this.Enum_DestinationMappingType.扩展) {
            this.treeObj_right.removeNode(deleteNodeData, false);
        }
        //发送请求，更新数据
        thisRule.DestinationMappingType = 0;
        thisRule.DestinationFieldID = "";
        thisRule.DestinationFieldName = "";
        this.mapping_service.updateRuleOfSection(this.mapping_id, sectionID, ruleID, thisRule)
            .subscribe(data => {
                //计数器-1
                this.countNum($("#" + deleteNodeData.tId + "_a"), -1);
                this.allGroupData[groupIndex] = data;
            });
    }
    //删除行
    deleteGroupLine(sectionIndex, tableIndex, ruleIndex, sectionID, ruleID) {
        let sourceId;
        let destinationId;
        let sourceNode;
        let targetNode;
        this.mapping_service.deleteSectionLine(this.mapping_id, sectionID, ruleID)
            .subscribe(data => {
                //计数器
                sourceId = this.allGroupData[sectionIndex].Tables[tableIndex].Rules[ruleIndex].SourceFieldID;
                destinationId = this.allGroupData[sectionIndex].Tables[tableIndex].Rules[ruleIndex].DestinationFieldID;
                //左侧节点计数-1
                if (sourceId !== "") {
                    sourceNode = this.treeObj_left.getNodeByParam("FieldID", sourceId);
                    this.countNum($("#" + sourceNode.tId + "_a"), -1);
                }
                //右侧节点计数-1
                if (destinationId !== "") {
                    targetNode = this.treeObj_right.getNodeByParam("FieldID", destinationId);
                    this.countNum($("#" + targetNode.tId + "_a"), -1);
                }
                //针对右侧多选项值,如果有值，则计数-1
                if (this.allGroupData[sectionIndex].Tables[tableIndex].Rules[ruleIndex].OptionValues.length > 0) {
                    for (let i = 0; i < this.allGroupData[sectionIndex].Tables[tableIndex].Rules[ruleIndex].OptionValues.length; i++) {
                        destinationId = this.allGroupData[sectionIndex].Tables[tableIndex].Rules[ruleIndex].OptionValues[i].DestinationFieldID;
                        if (destinationId !== "") {
                            targetNode = this.treeObj_right.getNodeByParam("FieldID", destinationId);
                            this.countNum($("#" + targetNode.tId + "_a"), -1);
                        }
                    }
                }
                console.log(data);
                this.allGroupData[sectionIndex] = data;
            });
    }
    //清空目标分组-
    deleteTargetGroup(groupIndex, sectionID) {
        this.mapping_service.deleteSectionTarget(this.mapping_id, sectionID)
            .subscribe(data => {
                if (data) {
                    //计数器-1
                    for (let i = 0; i < this.allGroupData[groupIndex].Tables.length; i++) {
                        for (let j = 0; j < this.allGroupData[groupIndex].Tables[i].Rules.length; j++) {
                            let destinationFieldId = this.allGroupData[groupIndex].Tables[i].Rules[j].DestinationFieldID;
                            if (destinationFieldId !== "") {
                                let targetNode = this.treeObj_right.getNodeByParam("FieldID", destinationFieldId);
                                this.countNum($("#" + targetNode.tId + "_a"), -1);
                            }
                        }
                    }
                    this.allGroupData[groupIndex] = data;
                }
            });

    }
    //显示/隐藏多选项值
    switch_ShowMultipleValues(thisRule) {
        if (thisRule.IsMultiple) {
            if (thisRule.OptionValues.length > 0) {
                this.mapping_service.hideMultipleValues(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID)
                    .subscribe(data => {
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].IsDeleted && i === (data.length - 1)) {
                                thisRule.OptionValues = [];
                            }
                        }

                    });
            }
            else {
                this.mapping_service.showMultipleValues(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID)
                    .subscribe(data => {
                        thisRule.OptionValues = data;
                    });
            }
        }
        else {
            return false;
        }
    }
    //过滤分组【点击弹出模态框】
    filterData(sectionId: number, sectionIndex: number) {
        this.modal.open(MappingMatchFilterComponent, overlayConfigFactory(<MappingMatchFilterContext>{
            mappingId: this.mapping_id,
            sectionId: sectionId,
            isTemporary: false
        }, BSModalContext))
            .then(data => {
                data.result.then(return_data => {
                    if (return_data.IsOk) {
                        if (return_data.IsAdd) {
                            this.allGroupData[sectionIndex].DataFilterType = this.Enum_DataFilterType.有筛选无更新;
                        }
                        else {
                            this.allGroupData[sectionIndex].DataFilterType = this.Enum_DataFilterType.无筛选;
                        }
                    }
                }).catch(() => { });
            });
    }
    //过滤临时表【点击弹出模态框】
    filterVariableOfTempGroup(tempTableIndex: number, tempSectionIndex: number) {
        this.modal.open(MappingMatchFilterComponent, overlayConfigFactory(<MappingMatchFilterContext>{
            mappingId: this.mapping_id,
            tempororyTableId: this.allTempTablesData[tempTableIndex].TempororyTableID,
            tempororyTableSectionId: this.allTempTablesData[tempTableIndex].Sections[tempSectionIndex].TempororyTableSectionID,
            isTemporary: true
        }, BSModalContext))
            .then(data => {
                data.result.then(return_data => {
                    if (return_data.IsOk) {
                        if (return_data.IsAdd) {
                            this.allTempTablesData[tempTableIndex].Sections[tempSectionIndex].DataFilterType = this.Enum_DataFilterType.有筛选无更新;
                        }
                        else {
                            this.allTempTablesData[tempTableIndex].Sections[tempSectionIndex].DataFilterType = this.Enum_DataFilterType.无筛选;
                        }
                    }
                }).catch(() => { });
            });
    }
    //提交指定变量
    submitAssignVariable(value, thisRule, groupIndex) {
        thisRule.SourceFieldName = value;
        thisRule.SourceMappingType = this.Enum_SourceMappingType.指定;
        this.mapping_service.updateRuleOfSection(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID, thisRule)
            .subscribe(data => {
                this.allGroupData[groupIndex] = data;
                return;
            });
    }
    //扩展和临时函数 CanChangeTable
    extendAndTempVar(groupIndex, tableIndex, ruleIndex, multipleRuleIndex, isMultiple, newRule, type) {
        this.allGroupData[groupIndex].CanChangeTable = false;
        let newNode = {};
        let fatherTableNode;
        let fatherNode;
        if (!isMultiple) {
            this.allGroupData[groupIndex].Tables[tableIndex].Rules[ruleIndex] = newRule;
        }
        else {
            this.allGroupData[groupIndex].Tables[tableIndex].Rules[ruleIndex].OptionValues[multipleRuleIndex] = newRule;
        }
        if (type === "extends") {
            newNode = {
                "FieldID": newRule.DestinationFieldID,
                "ParentFieldID": this.allGroupData[groupIndex].DestinationTableID,
                "FieldName": newRule.DestinationFieldName,
                "FieldType": 6,
                "FieldStatus": 1,
                "MappingTimes": 1,
                "open": false,
                "Children": []
            }
            fatherTableNode = this.treeObj_right.getNodeByParam("FieldID", this.allGroupData[groupIndex].DestinationTableID);
            fatherNode = this.treeObj_right.getNodeByParam("FieldName", "扩展变量", fatherTableNode);
        }
        else {
            newNode = {
                "FieldID": newRule.DestinationFieldID,
                "ParentFieldID": this.allGroupData[groupIndex].DestinationTableID,
                "FieldName": newRule.DestinationFieldName,
                "FieldType": 7,
                "FieldStatus": 1,
                "MappingTimes": 1,
                "open": false,
                "Children": []
            }
            fatherTableNode = this.treeObj_right.getNodeByParam("FieldID", this.allGroupData[groupIndex].DestinationTableID);
            fatherNode = this.treeObj_right.getNodeByParam("FieldName", "临时变量", fatherTableNode);
        }
        this.treeObj_right.addNodes(fatherNode, newNode);
    }
    //提交扩展变量
    submitExtendsVariable(value, thisRule, groupIndex, tableIndex, ruleIndex, multipleRuleIndex, isMultiple) {
        if (value.trim() !== "") {
            thisRule.DestinationMappingType = this.Enum_DestinationMappingType.扩展;
            this.mapping_service.createExpandVariable(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID, this.standard_id, this.allGroupData[groupIndex].DestinationTableID, value.trim())
                .subscribe(data => {
                    this.extendAndTempVar(groupIndex, tableIndex, ruleIndex, multipleRuleIndex, isMultiple, data, "extends");
                });
        }
        else {
            alert("变量不能为空");
        }
    }
    //提交临时变量
    submitTempVariable(value, thisRule, groupIndex, tableIndex, ruleIndex, multipleRuleIndex, isMultiple) {
        if (value.trim() !== "") {
            thisRule.DestinationMappingType = this.Enum_DestinationMappingType.临时;
            this.mapping_service.createTempVariable(this.mapping_id, thisRule.MappingSectionID, thisRule.MappingRuleID, this.standard_id, this.allGroupData[groupIndex].DestinationTableID, value.trim())
                .subscribe(data => {
                    this.extendAndTempVar(groupIndex, tableIndex, ruleIndex, multipleRuleIndex, isMultiple, data, "temp");
                });
        }
        else {
            alert("变量不能为空");
        }
    }
    //提交所有分组/取消提交
    submitAllGroup() {
        let canBeSubmited: boolean = true;
        if (this.allGroupData.length > 0) {
            for (let i = 0; i < this.allGroupData.length; i++) {
                if (this.allGroupData[i].Tables.length > 0) {
                    for (let j = 0; j < this.allGroupData[i].Tables.length; j++) {
                        for (let k = 0; k < this.allGroupData[i].Tables[j].Rules.length; k++) {
                            if (this.allGroupData[i].Tables[j].Rules[k].SourceMappingType === this.Enum_SourceMappingType.无 || this.allGroupData[i].Tables[j].Rules[k].DestinationMappingType === this.Enum_DestinationMappingType.无) {
                                canBeSubmited = false;
                                alert("必须完全匹配，不能有空值");
                                return;
                            }
                            else {
                                if (this.allGroupData[i].Tables[j].Rules[k].OptionValues.length > 0) {
                                    for (let x = 0; x < this.allGroupData[i].Tables[j].Rules[k].OptionValues.length; x++) {
                                        if (this.allGroupData[i].Tables[j].Rules[k].OptionValues[x].DestinationMappingType === this.Enum_DestinationMappingType.无) {
                                            alert("必须完全匹配，多选值目标不能有空值");
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    canBeSubmited = false;
                    alert("请先创建一个规则！");
                    return;
                }
            }
        }
        else {
            canBeSubmited = false;
            alert("请先创建一个分组！");
            return;
        }
        if (canBeSubmited) {
            this.mapping_service.submitMappings(this.mapping_id)
                .subscribe(data => {
                    console.log("提交成功");
                    this.allGroupData = data.Sections;
                    this.allTempTablesData = data.TemporaryTables;
                    alert("提交成功！");
                });
        }
    }
    //更新所有分组
    updateAllGroups(isUpdating) {
        if (isUpdating) {
            return false;
        }
        else {
            this.mapping_service.updateMappings(this.mapping_id)
                .subscribe(data => {
                    console.log("更新成功");
                    this.taskStatus_isUpdate = true;
                });
        }

    }
    //跳转到选项值及关联表设置页面
    routeSettingPage() {
        if (this.taskStatus_isUpdate) {
            this.route.navigate(['/mapping/option', this.mapping_id]);
        }
        else {
            alert("必须更新数据后才能设置！");
        }
    }
    //添加临时表
    addTempTable() {
        this.mapping_service.createTempTable(this.mapping_id)
            .subscribe(data => {
                let newNode = {
                    "FieldID": data.TempororyTableID,
                    "ParentFieldID": "0",
                    "FieldName": data.TempororyTableName,
                    "FieldType": 2,
                    "FieldStatus": 1,
                    "MappingTimes": 0,
                    "open": false,
                    "Children": []
                }
                let tempNode = this.treeObj_right.addNodes(null, newNode);
                this.allTempTablesData.push(data);
            });
    }
    //删除临时表
    deleteTempTable(startIndex: number, tempTableID: number) {
        this.mapping_service.deleteTempTable(this.mapping_id, tempTableID)
            .subscribe(data => {
                if (data.IsDeleted) {
                    let removeTreeNode = this.treeObj_right.getNodeByParam("FieldID", tempTableID);
                    this.treeObj_right.removeNode(removeTreeNode);
                    this.allTempTablesData.splice(startIndex, 1);
                }
            });
    }
    //添加临时表的分组
    addTempGroup(tempTableID, tempTable_index) {
        this.mapping_service.createTempGroup(this.mapping_id, tempTableID)
            .subscribe(data => {
                this.allTempTablesData[tempTable_index].Sections.push(data);
            });
    }
    //删除临时表中的表头/变量，通用一个接口
    deleteTableOrVariableOfTempGroup(temp_table_index, temp_group_index, temp_tableOfGroup_index, temp_field_index, tempTableID: number, tempTableSectionID: number, tempTableVariableID: string, isTableHead: boolean) {
        this.mapping_service.deleteTempGroupVariable(this.mapping_id, tempTableID, tempTableSectionID, tempTableVariableID, isTableHead)
            .subscribe(data => {
                this.allTempTablesData[temp_table_index] = data;
            });
    }
    /*-----------------------------------------拖、放节点的方法--------------------------------------------*/
    //拖动配置、逻辑处理（jQueryUI方法）
    madeDrag_Drop() {
        //绑定放置位置，放的逻辑处理（jQueryUI方法）
        $(".droppabled").droppable({
            scope: "perMatch",
            greedy: true,
            drop: (event, ui) => {
                /*
                    目标容器dom:    event.target;
                    isLeft_td:      是否是左侧的td容器
                    ui.draggable:   被拖拽的jQuery对象
                    sectionIndex:   当前分组的index位置
                    has_leftData:   当前分组左侧是否有数据
                    has_rightData:  当前分组右侧是否有数据
                */
                console.log("运行一次drop");
                event.stopPropagation();
                //判断是否是左节点flag
                let isLeftNode = true;
                //获取此节点的id
                let treeNodeId = ui.draggable.parent('li').attr('id');
                //获取此节点的数据
                if (treeNodeId.indexOf("source_tree") > -1) {
                    this.nodeData = this.treeObj_left.getNodeByTId(treeNodeId);
                }
                else {
                    this.nodeData = this.treeObj_right.getNodeByTId(treeNodeId);
                    isLeftNode = false;
                }
                //获取此分组在页面中分组中的index位置
                let sectionIndex = $(".perTableMatches").index($(event.target).parents(".perTableMatches"));
                //是否是临时表容器
                if ($(event.target).hasClass("tempTableEmptyLine")) {
                    console.log("Temp区域");
                    //获取此临时表在页面中所有临时表的index位置 
                    let tempTableIndex = $(".tempTablesArea").index($(event.target).parents(".tempTablesArea"));
                    //获取此分组在此临时表中的所有分组的位置
                    let tempGroupIndex = $(event.target).parents(".tempTablesArea").find(".sGroupArea").index($(event.target).parents(".sGroupArea"));
                    //是左节点且为表节点
                    if (isLeftNode && (this.Enum_StudyFieldType[this.nodeData.FieldType] === "CRF表" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "列表字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "Patient")) {
                        //如果有子节点
                        if (this.nodeData.Children.length > 0) {
                            //设置一个boolean值，用来判断此节点是否有“普通变量/多选变量”
                            let isHasVariable: boolean = false;
                            //设置一个装载“普通变量/多选变量”节点数据的数组
                            let rulesNodeArray = [];
                            //遍历看“直接”子节点是否有普通变量/多选变量
                            for (let i = 0; i < this.nodeData.Children.length; i++) {
                                if (this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.普通字段 || this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.多选字段 || this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.访视字段) {
                                    //修改boolean值
                                    isHasVariable = true;
                                    //获取要发送的rules数据
                                    rulesNodeArray.push(this.nodeData.Children[i]);
                                }
                            }
                            console.log(rulesNodeArray);
                            /*--------------------创建此临时表的分组的Rules--------------------*/
                            //如果源节点有变量子节
                            if (isHasVariable) {
                                let rulesArray: Array<server.TempororyTableFieldViewModel> = [];
                                //获取此分组中的表的id和name
                                let thisTableId = this.nodeData.FieldID;
                                let thisTableName = this.nodeData.FieldName;
                                //获取临时表id
                                let tempTableId = this.allTempTablesData[tempTableIndex].TempororyTableID;
                                //获取分组id
                                let tempGroupId = this.allTempTablesData[tempTableIndex].Sections[tempGroupIndex].TempororyTableSectionID;
                                //遍历-普通变量/多选变量
                                for (let i = 0; i < rulesNodeArray.length; i++) {
                                    //RulesJSON数据结构
                                    let RuleJSON = <server.TempororyTableFieldViewModel>{
                                        "TempororyTableFieldID": tempTableId,
                                        "TempororyTableSectionID": tempGroupId,
                                        "SourceTableID": thisTableId,
                                        "SourceTableName": thisTableName,
                                        "SourceFieldID": "",
                                        "SourceFieldName": "",
                                        "FieldType": 1,
                                        "ParentID": 0,
                                        "Sort": 0
                                    };
                                    rulesArray.push(RuleJSON);
                                    rulesArray[i].SourceFieldID = rulesNodeArray[i].FieldID;
                                    rulesArray[i].SourceFieldName = rulesNodeArray[i].FieldName;
                                }
                                this.mapping_service.creatTempGroupVariables(this.mapping_id, tempTableId, tempGroupId, rulesArray)
                                    .subscribe(data => {
                                        this.allTempTablesData[tempTableIndex].Sections[tempGroupIndex] = data;
                                    });
                            }
                            else {
                                alert("此表虽有子节点，但子节点没有【普通变量】或【多选变量】，无法拖拽");
                            }
                        }
                        else {
                            alert("此表没有子节点，无法拖拽");
                        }
                    }
                    //是左节点且为字段节点
                    else if (isLeftNode && (this.Enum_StudyFieldType[this.nodeData.FieldType] === "普通字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "多选字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "访视字段")) {
                        let rulesArray: Array<server.TempororyTableFieldViewModel> = [];
                        //获取此分组中的表的id和name
                        let thisTableId = this.nodeData.getParentNode().FieldID;
                        let thisTableName = this.nodeData.getParentNode().FieldName;
                        //获取临时表id
                        let tempTableId = this.allTempTablesData[tempTableIndex].TempororyTableID;
                        //获取分组id
                        let tempGroupId = this.allTempTablesData[tempTableIndex].Sections[tempGroupIndex].TempororyTableSectionID;
                        //RulesJSON数据结构
                        let RuleJSON = <server.TempororyTableFieldViewModel>{
                            "TempororyTableFieldID": tempTableId,
                            "TempororyTableSectionID": tempGroupId,
                            "SourceTableID": thisTableId,
                            "SourceTableName": thisTableName,
                            "SourceFieldID": this.nodeData.FieldID,
                            "SourceFieldName": this.nodeData.FieldName,
                            "FieldType": this.nodeData.FieldType,
                            "ParentID": 0,
                            "Sort": 0
                        };
                        rulesArray.push(RuleJSON);
                        this.mapping_service.creatTempGroupVariables(this.mapping_id, tempTableId, tempGroupId, rulesArray)
                            .subscribe(data => {
                                this.allTempTablesData[tempTableIndex].Sections[tempGroupIndex] = data;
                            });
                    }
                }
                //如果放在多选变量值的行              
                else if (!isLeftNode && $(event.target).hasClass("perTargetValue") && this.Enum_StandardFieldType[this.nodeData.FieldType] === "普通变量") {
                    console.log("进入多选值区域");
                    if (this.allGroupData[sectionIndex].DestinationTableID === "" || (this.allGroupData[sectionIndex].DestinationTableID !== "" && this.nodeData.getParentNode().FieldID === this.allGroupData[sectionIndex].DestinationTableID)) {
                        //rule的index
                        let ruleIndex = 0;
                        //分组的index
                        console.log(sectionIndex);
                        //获取此行的ruleID
                        let thisRuleID = $(event.target).parents("td").attr("data-mappingRuleID");
                        //选项值中的id
                        let thisOptionRuleID = $(event.target).attr("data-mappingOptionRuleID");
                        //这行数据json
                        let thisRuleJSON = <server.StudyStandardMappingRuleViewModel>{};
                        for (let k = 0; k < this.allGroupData[sectionIndex].Tables.length; k++) {
                            for (let i = 0; i < this.allGroupData[sectionIndex].Tables[k].Rules.length; i++) {
                                if (this.allGroupData[sectionIndex].Tables[k].Rules[i].MappingRuleID === parseInt(thisRuleID)) {
                                    for (let j = 0; j < this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues.length; j++) {
                                        if (this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].MappingRuleID === parseInt(thisOptionRuleID)) {
                                            //更新option-rule字段名
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].DestinationFieldName = this.nodeData.FieldName;
                                            //更新option-rule  id名
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].DestinationFieldID = this.nodeData.FieldID;
                                            //更新option-rule  表名
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].DestinationTableName = this.nodeData.getParentNode().FieldName;
                                            //更新option-rule  表ID
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].DestinationTableID = this.nodeData.getParentNode().FieldID;
                                            //更新option-rule选项状态
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].OptionValues[j].DestinationMappingType = this.Enum_DestinationMappingType.普通;
                                            //更新目标分组的表头和表id
                                            this.allGroupData[sectionIndex].Tables[k].DestinationTableName = this.nodeData.getParentNode().FieldName;
                                            this.allGroupData[sectionIndex].Tables[k].DestinationTableID = this.nodeData.getParentNode().FieldID;
                                            //更新分组中的Rule的表name和id
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].DestinationTableName = this.nodeData.getParentNode().FieldName;
                                            this.allGroupData[sectionIndex].Tables[k].Rules[i].DestinationTableID = this.nodeData.getParentNode().FieldID;
                                            thisRuleJSON = this.allGroupData[sectionIndex].Tables[k].Rules[i];
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        //计数器
                        let mappingNumDom = ui.draggable.find(".mappingMatch_TimesTip");
                        if (parseInt(mappingNumDom.text()) === 0) {
                            mappingNumDom.removeClass("mappingMatch_TimesTipHide");
                        }
                        let mappingNum = parseInt(mappingNumDom.text()) + 1;
                        mappingNumDom.text(mappingNum);
                        //发送请求，更新数据
                        this.mapping_service.updateRuleOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, parseInt(thisRuleID), thisRuleJSON)
                            .subscribe(data => {
                                this.allGroupData[sectionIndex] = data;
                            });
                    }
                    else {
                        alert("此节点的表名和分组中的目标表不一致");
                    }
                }
                else {
                    console.log("Mapping区域");
                    //是否是左侧容器
                    let isLeft_td = $(event.target).hasClass("leftTD");
                    //是否是空白容器
                    let isEmptyTD = $(event.target).hasClass("emptyTD");
                    //判断这个分组的数据状态，左右是否有数据flag
                    let has_leftData = false;
                    let has_rightData = false;
                    if (this.allGroupData[sectionIndex].Tables.length > 0) {
                        for (let i = 0; i < this.allGroupData[sectionIndex].Tables.length; i++) {
                            for (let j = 0; j < this.allGroupData[sectionIndex].Tables[i].Rules.length; j++) {
                                if (this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceFieldName !== "") {
                                    has_leftData = true;
                                }
                                if (this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationFieldName !== "") {
                                    has_rightData = true;
                                }
                            }
                        }
                    }
                    //位置不合格：如果左节点放在右容器/右节点放在左容器
                    if ((isLeftNode && !isLeft_td) || (!isLeftNode && isLeft_td)) {
                        alert("请放在正确的位置！");
                        return;
                    }
                    //(1)左节点-创建：
                    if (isLeftNode && (this.Enum_StudyFieldType[this.nodeData.FieldType] === "普通字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "多选字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "访视字段") && isEmptyTD) {
                        console.log("左节点-创建");
                        let rulesArray: Array<server.StudyStandardMappingRuleViewModel> = []
                        //RulesJSON数据结构
                        let RuleJSON = <server.StudyStandardMappingRuleViewModel>{
                            "MappingRuleID": 0,
                            "MappingSectionID": this.allGroupData[sectionIndex].MappingSectionID,
                            "SourceTableID": this.nodeData.getParentNode().FieldID,
                            "SourceTableName": this.nodeData.getParentNode().FieldName,
                            "SourceFieldID": this.nodeData.FieldID,
                            "SourceFieldName": this.nodeData.FieldName,
                            "DestinationTableID": "",
                            "DestinationTableName": "",
                            "DestinationFieldID": "",
                            "DestinationFieldName": "",
                            "SourceMappingType": 1,
                            "SpecifySourceValue": "",
                            "DestinationMappingType": 0,
                            "IsMultiple": false,
                            "OptionValues": [],
                            "ParentID": 0,
                            "DataStatus": 2,
                            "ToBeDel": false,
                            "Comments": ""
                        };
                        //判断节点是否是 多选变量
                        if (this.nodeData.FieldType === this.Enum_StudyFieldType.多选字段) {
                            RuleJSON.IsMultiple = true;
                        }

                        rulesArray.push(RuleJSON);
                        this.mapping_service.createRulesOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, rulesArray)
                            .subscribe(data => {
                                //计数器+1
                                this.countNum(ui.draggable, 1);
                                console.log(data);
                                this.allGroupData[sectionIndex] = data;
                            });
                    }
                    //(2)左节点-更新：
                    else if (isLeftNode && (this.Enum_StudyFieldType[this.nodeData.FieldType] === "普通字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "多选字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "访视字段") && !isEmptyTD) {
                        console.log("左节点-更新");
                        //获取此行所在的源表的sourceTableId
                        let thisSourceTableID = $(event.target).attr("data-mappingSourceTableID");
                        //获取此行的ruleID
                        let thisRuleID = $(event.target).attr("data-mappingRuleID");
                        //这行数据json
                        let thisRuleJSON = <server.StudyStandardMappingRuleViewModel>{};
                        //获取此变量的值
                        for (let i = 0; i < this.allGroupData[sectionIndex].Tables.length; i++) {
                            if (this.allGroupData[sectionIndex].Tables[i].SourceTableID === thisSourceTableID) {
                                for (let j = 0; j < this.allGroupData[sectionIndex].Tables[i].Rules.length; j++) {
                                    if (this.allGroupData[sectionIndex].Tables[i].Rules[j].MappingRuleID == thisRuleID) {
                                        //更新Rule的SourceFieldID
                                        this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceFieldID = this.nodeData.FieldID;
                                        //更新Rule的SourceFieldName
                                        this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceFieldName = this.nodeData.FieldName;
                                        //更新Rule的SourceTableID
                                        this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceTableID = this.nodeData.getParentNode().FieldID;
                                        //更新Rule的SourceTableName
                                        this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceTableName = this.nodeData.getParentNode().FieldName;
                                        //更新Rule的SourceMappingType
                                        this.allGroupData[sectionIndex].Tables[i].Rules[j].SourceMappingType = this.Enum_SourceMappingType.普通;
                                        //判断节点是否是 多选变量
                                        if (this.nodeData.FieldType === this.Enum_StudyFieldType.多选字段) {
                                            this.allGroupData[sectionIndex].Tables[i].Rules[j].IsMultiple = true;
                                        }
                                        thisRuleJSON = this.allGroupData[sectionIndex].Tables[i].Rules[j];
                                        break;
                                    };
                                }
                                break;
                            }
                        };
                        this.mapping_service.updateRuleOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, parseInt(thisRuleID), thisRuleJSON)
                            .subscribe(data => {
                                //计数器+1
                                this.countNum(ui.draggable, 1);
                                this.allGroupData[sectionIndex] = data;
                            });
                    }
                    //(3)右节点-更新：
                    else if (!isLeftNode && (this.Enum_StandardFieldType[this.nodeData.FieldType] === "普通变量") && !isEmptyTD) {
                        console.log("右节点-更新");
                        //获取此行所在的源表的sourceTableId
                        let thisSourceTableID = $(event.target).attr("data-mappingSourceTableID");
                        //获取目标表的destinationTableID
                        let thisDestinationTableID = $(event.target).attr("data-mappingDestinationTableID");
                        //获取此行的ruleID
                        let thisRuleID = $(event.target).attr("data-mappingRuleID");
                        console.log("thisRuleID：" + thisRuleID);
                        let isHasSame = false;
                        //判断容器中是否是相同的表，且有相同的目标变量
                        if (this.nodeData.getParentNode().FieldID === thisDestinationTableID || thisDestinationTableID === "") {
                            for (let i = 0; i < this.allGroupData[sectionIndex].Tables.length; i++) {
                                if (this.allGroupData[sectionIndex].Tables[i].SourceTableID === thisSourceTableID) {
                                    for (let j = 0; j < this.allGroupData[sectionIndex].Tables[i].Rules.length; j++) {
                                        //如果分组中有相同的变量
                                        if (this.nodeData.FieldID === this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationFieldID) {
                                            isHasSame = true;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            //如果拖入的目标变量没有重复
                            if (!isHasSame) {
                                let rulesArray: Array<server.StudyStandardMappingRuleViewModel> = [];
                                //这行数据json
                                let thisRuleJSON = <server.StudyStandardMappingRuleViewModel>{};
                                //获取此变量的值，此处可以用若干的index直接获取此行数据，不用遍历
                                for (let i = 0; i < this.allGroupData[sectionIndex].Tables.length; i++) {
                                    if (this.allGroupData[sectionIndex].Tables[i].SourceTableID === thisSourceTableID) {
                                        for (let j = 0; j < this.allGroupData[sectionIndex].Tables[i].Rules.length; j++) {
                                            if (this.allGroupData[sectionIndex].Tables[i].Rules[j].MappingRuleID == thisRuleID) {
                                                //更新rule的目标id
                                                this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationFieldID = this.nodeData.FieldID;
                                                //更新rule的目标name
                                                this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationFieldName = this.nodeData.FieldName;
                                                //更新rule的目标DestinationTableID
                                                this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationTableID = this.nodeData.getParentNode().FieldID;
                                                //更新rule的目标DestinationTableName
                                                this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationTableName = this.nodeData.getParentNode().FieldName;
                                                //更新目标节点的状态
                                                this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationMappingType = this.Enum_DestinationMappingType.普通;
                                                thisRuleJSON = this.allGroupData[sectionIndex].Tables[i].Rules[j];
                                                break;
                                            };
                                        }
                                        break;
                                    }
                                };
                                this.mapping_service.updateRuleOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, parseInt(thisRuleID), thisRuleJSON)
                                    .subscribe(data => {
                                        //计数器+1
                                        this.countNum(ui.draggable, 1);
                                        this.allGroupData[sectionIndex] = data;
                                    });
                            }
                            else {
                                alert("此节点已经在分组的目标变量中");
                            }
                        }
                        else {
                            alert("目标表和节点不一致");
                        }
                    }
                    //(4)右节点-创建：
                    else if (!isLeftNode && (this.Enum_StandardFieldType[this.nodeData.FieldType] === "普通变量") && isEmptyTD) {
                        console.log("右节点-创建");
                        //获取分组源表的sourceTableId
                        let thisSourceTableID = this.allGroupData[sectionIndex].SourceTableID;
                        //获取分组目标表的destinationTableID
                        let thisDestinationTableID = this.allGroupData[sectionIndex].DestinationTableID;
                        let isHasSame = false;
                        //判断容器中是否有相同的目标变量
                        if (this.nodeData.getParentNode().FieldID === thisDestinationTableID || thisDestinationTableID === "") {
                            for (let i = 0; i < this.allGroupData[sectionIndex].Tables.length; i++) {
                                if (this.allGroupData[sectionIndex].Tables[i].SourceTableID === thisSourceTableID) {
                                    for (let j = 0; j < this.allGroupData[sectionIndex].Tables[i].Rules.length; j++) {
                                        //如果分组中有相同的变量
                                        if (this.nodeData.FieldID === this.allGroupData[sectionIndex].Tables[i].Rules[j].DestinationFieldID) {
                                            isHasSame = true;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            //如果拖入的目标变量没有重复
                            if (!isHasSame) {
                                let rulesArray: Array<server.StudyStandardMappingRuleViewModel> = [];
                                //RulesJSON数据结构
                                let RuleJSON = <server.StudyStandardMappingRuleViewModel>{
                                    "MappingRuleID": 0,
                                    "MappingSectionID": this.allGroupData[sectionIndex].MappingSectionID,
                                    "SourceTableID": "",
                                    "SourceTableName": "",
                                    "SourceFieldID": "",
                                    "SourceFieldName": "",
                                    "DestinationTableID": this.nodeData.getParentNode().FieldID,
                                    "DestinationTableName": this.nodeData.getParentNode().FieldName,
                                    "DestinationFieldID": this.nodeData.FieldID,
                                    "DestinationFieldName": this.nodeData.FieldName,
                                    "SourceMappingType": 0,
                                    "SpecifySourceValue": "",
                                    "DestinationMappingType": 1,
                                    "IsMultiple": false,
                                    "OptionValues": [],
                                    "ParentID": 0,
                                    "DataStatus": 2,
                                    "ToBeDel": false,
                                    "Comments": ""
                                };
                                //处理发送的rule数组数据
                                rulesArray.push(RuleJSON);
                                this.mapping_service.createRulesOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, rulesArray)
                                    .subscribe(data => {
                                        //计数器+1
                                        this.countNum(ui.draggable, 1);
                                        this.allGroupData[sectionIndex] = data;
                                    });
                            }
                            else {
                                alert("此节点已经在分组的目标变量中");
                            }
                        }
                        else {
                            alert("目标表和节点不一致");
                        }
                    }
                    //(5)左表节点-创建：
                    else if (isLeftNode && (this.Enum_StudyFieldType[this.nodeData.FieldType] === "CRF表" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "列表字段" || this.Enum_StudyFieldType[this.nodeData.FieldType] === "Patient") && isEmptyTD) {
                        console.log("左表节点-创建");
                        //若容器右侧为空
                        if (!has_rightData) {
                            //如果有子节点
                            if (this.nodeData.Children.length > 0) {
                                //设置一个boolean值，用来判断此节点是否有“普通变量/多选变量”
                                let isHasVariable: boolean = false;
                                //设置一个装载“普通变量/多选变量”节点数据的数组
                                let rulesNodeArray = [];
                                //遍历看“直接”子节点是否有普通变量/多选变量
                                for (let i = 0; i < this.nodeData.Children.length; i++) {
                                    if (this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.普通字段 || this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.多选字段 || this.nodeData.Children[i].FieldType === this.Enum_StudyFieldType.访视字段) {
                                        //修改boolean值
                                        isHasVariable = true;
                                        //获取要发送的rules数据
                                        rulesNodeArray.push(this.nodeData.Children[i]);
                                    }
                                }
                                //如果源节点有变量子节
                                if (isHasVariable) {
                                    let rulesArray: Array<server.StudyStandardMappingRuleViewModel> = [];
                                    //遍历-普通变量/多选变量
                                    for (let i = 0; i < rulesNodeArray.length; i++) {
                                        //RulesJSON数据结构
                                        let RuleJSON = <server.StudyStandardMappingRuleViewModel>{
                                            "MappingRuleID": 0,
                                            "MappingSectionID": this.allGroupData[sectionIndex].MappingSectionID,
                                            "SourceTableID": this.nodeData.FieldID,
                                            "SourceTableName": this.nodeData.FieldName,
                                            "SourceFieldID": "",
                                            "SourceFieldName": "",
                                            "DestinationTableID": "",
                                            "DestinationTableName": "",
                                            "DestinationFieldID": "",
                                            "DestinationFieldName": "",
                                            "SourceMappingType": 1,
                                            "SpecifySourceValue": "",
                                            "DestinationMappingType": 0,
                                            "IsMultiple": false,
                                            "OptionValues": [],
                                            "ParentID": 0,
                                            "DataStatus": 2,
                                            "ToBeDel": false,
                                            "Comments": ""
                                        };
                                        rulesArray.push(RuleJSON);
                                        rulesArray[i].SourceFieldID = rulesNodeArray[i].FieldID;
                                        rulesArray[i].SourceFieldName = rulesNodeArray[i].FieldName;
                                        //判断此变量是否是多选值,如果是多选值变量则遍历获取
                                        if (rulesNodeArray[i].FieldType === this.Enum_StudyFieldType.多选字段) {
                                            rulesArray[i].IsMultiple = true;
                                        }
                                    }
                                    this.mapping_service.createRulesOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, rulesArray)
                                        .subscribe(data => {
                                            for (let i = 0; i < rulesNodeArray.length; i++) {
                                                //计数器+1
                                                this.countNum($("#" + rulesNodeArray[i].tId + " a"), 1);
                                            }
                                            this.allGroupData[sectionIndex] = data;
                                        });
                                }
                                else {
                                    alert("此表虽有子节点，但子节点没有【普通变量】或【多选变量】，无法拖拽");
                                }
                            }
                            else {
                                alert("此表没有子节点，无法拖拽");
                            }
                        }
                        else {
                            alert("右侧不为空时，只能拖拽左侧字段");
                        }

                    }
                    //(6)右表节点-创建：
                    else if (!isLeftNode && (this.Enum_StandardFieldType[this.nodeData.FieldType] === "域") && isEmptyTD) {
                        console.log("右表节点-创建");
                        if (!has_leftData) {
                            let rulesArray: Array<server.StudyStandardMappingRuleViewModel> = [];
                            //设置一个装载“普通变量/多选变量”节点数据的数组
                            let rulesNodeArray = [];
                            //遍历子节点
                            for (let i = 0; i < this.nodeData.Children.length; i++) {
                                //如果子节点是普通变量
                                if (this.nodeData.Children[i].FieldType === 5) {
                                    //RulesJSON数据结构
                                    let RuleJSON = <server.StudyStandardMappingRuleViewModel>{
                                        "MappingRuleID": 0,
                                        "MappingSectionID": this.allGroupData[sectionIndex].MappingSectionID,
                                        "SourceTableID": "",
                                        "SourceTableName": "",
                                        "SourceFieldID": "",
                                        "SourceFieldName": "",
                                        "DestinationTableID": this.nodeData.FieldID,
                                        "DestinationTableName": this.nodeData.FieldName,
                                        "DestinationFieldID": "",
                                        "DestinationFieldName": "",
                                        "SourceMappingType": 0,
                                        "SpecifySourceValue": "",
                                        "DestinationMappingType": 1,
                                        "IsMultiple": false,
                                        "OptionValues": [],
                                        "ParentID": 0,
                                        "DataStatus": 2,
                                        "ToBeDel": false,
                                        "Comments": ""
                                    };
                                    rulesNodeArray.push(this.nodeData.Children[i]);
                                    rulesArray.push(RuleJSON);
                                    rulesArray[i].DestinationFieldID = this.nodeData.Children[i].FieldID;
                                    rulesArray[i].DestinationFieldName = this.nodeData.Children[i].FieldName;
                                }
                            }
                            //改变表头
                            this.allGroupData[sectionIndex].DestinationTableName = this.nodeData.FieldName;
                            this.allGroupData[sectionIndex].DestinationTableID = this.nodeData.FieldID;
                            this.mapping_service.createRulesOfSection(this.mapping_id, this.allGroupData[sectionIndex].MappingSectionID, rulesArray)
                                .subscribe(data => {
                                    for (let i = 0; i < rulesNodeArray.length; i++) {
                                        //计数器+1
                                        this.countNum($("#" + rulesNodeArray[i].tId + " a"), 1);
                                    }
                                    this.allGroupData[sectionIndex] = data;
                                });
                        }
                        else {
                            alert("左侧不为空时，只能拖拽右侧字段");
                        }
                    }
                }

            }
        });
    }
    //渲染左右的源数据树，和目标数据树,从而显示树结构
    renderTree(dom, treeData) {
        // zTree 的参数配置
        let setting = {
            view: {
                //是否显示节点与节点之间的线
                showLine: false,
                //是否显示节点图标+ -
                showIcon: false,
                //用于在节点显示自定义dom，会用到
                addDiyDom: (treeId, treeNode) => {
                    let aObj = $("#" + treeNode.tId + "_a");
                    //增加节点状态和匹配次数
                    switch (treeNode.FieldStatus) {
                        case 0: {
                            //如果次数大于0，则显示被拖拽次数的tip
                            if (treeNode.MappingTimes > 0) {
                                aObj.append('<div class="mappingMatch_TimesTip ">' + treeNode.MappingTimes + '</div>');
                            }
                            else if (treeNode.MappingTimes === 0) {
                                aObj.append('<div class="mappingMatch_TimesTip mappingMatch_TimesTipHide">' + treeNode.MappingTimes + '</div>');
                            }
                        }
                            break;
                        case 1: {
                            aObj.append(`<div class="mappingMatch_Tip mappingMatch_sTip ">新增</div>`);
                            //如果次数大于0，则显示被拖拽次数的tip
                            if (treeNode.MappingTimes > 0) {
                                aObj.append('<div class="mappingMatch_TimesTip ">' + treeNode.MappingTimes + '</div>');
                            }
                            else if (treeNode.MappingTimes === 0) {
                                aObj.append('<div class="mappingMatch_TimesTip mappingMatch_TimesTipHide">' + treeNode.MappingTimes + '</div>');
                            }
                        }
                            break;
                        case 2: {
                            aObj.append(`<div class="mappingMatch_Tip mappingMatch_sTip ">修改</div>`);
                            //如果次数大于0，则显示被拖拽次数的tip
                            if (treeNode.MappingTimes > 0) {
                                aObj.append('<div class="mappingMatch_TimesTip ">' + treeNode.MappingTimes + '</div>');
                            }
                            else if (treeNode.MappingTimes === 0) {
                                aObj.append('<div class="mappingMatch_TimesTip mappingMatch_TimesTipHide">' + treeNode.MappingTimes + '</div>');
                            }
                        }
                            break;
                        case 3: {
                            aObj.append(`<div class="mappingMatch_Tip mappingMatch_sTip " title="已被删除，提交后将不再显示">已删除</div>`);
                            //如果是已删除，则灰色
                            aObj.addClass("forbiddenDrag");
                            //如果次数大于0，则显示被拖拽次数的tip
                            if (treeNode.MappingTimes > 0) {
                                aObj.append('<div class="mappingMatch_TimesTip ">' + treeNode.MappingTimes + '</div>');
                            }
                            else if (treeNode.MappingTimes === 0) {
                                aObj.append('<div class="mappingMatch_TimesTip mappingMatch_TimesTipHide">' + treeNode.MappingTimes + '</div>');
                            }
                        }
                            break;
                    }
                    //左侧树增加iconfont
                    if (treeId === "source_tree") {
                        switch (this.Enum_StudyFieldType[treeNode.FieldType]) {
                            case "普通字段": { aObj.prepend('<span title="普通字段" class="icon iconfont">&#xe68d;</span>'); } break;
                            case "多选字段": { aObj.prepend('<span title="多选字段" class="icon iconfont">&#xe66f;</span>'); } break;
                            case "多选选项字段": { aObj.prepend('<span title="多选选项字段" class="icon iconfont">&#xe620;</span>'); } break;
                            case "访视字段": { aObj.prepend('<span title="访视字段" class="icon iconfont">&#xe710;</span>'); } break;
                            case "列表字段": { aObj.prepend('<span title="列表字段" class="icon iconfont">&#xe66e;</span>'); } break;
                            case "CRF表": { aObj.prepend('<span title="CRF表" class="icon iconfont">&#xe629;</span>'); } break;
                            case "Patient": { aObj.prepend('<span title="Patient" class="icon iconfont">&#xe61f;</span>') } break;
                        }
                    }
                    //右侧树增加iconfont
                    else {
                        switch (this.Enum_StandardFieldType[treeNode.FieldType]) {
                            case "域": { aObj.prepend('<span title="域" class="icon iconfont">&#xe66e;</span>'); } break;
                            case "普通变量": { aObj.prepend('<span title="普通变量" class="icon iconfont">&#xe68d;</span>'); } break;
                            case "扩展变量": { aObj.prepend('<span title="扩展变量" class="icon iconfont">&#xe622;</span>'); } break;
                            case "临时变量": { aObj.prepend('<span title="临时变量" class="icon iconfont">&#xe623;</span>'); } break;
                            case "临时域": {
                                $("#" + treeNode.tId + " a").prepend('<span title="临时表" class="icon iconfont">&#xe66e;</span>');
                                $("#" + treeNode.tId + " a").append("<span class='tempTableFlag icon iconfont editTempName' title='编辑临时表'>&#xe612;</span>");
                                $("#" + treeNode.tId + " a .editTempName").click(() => {
                                    this.treeObj_right.editName(treeNode);
                                });
                            } break;
                        }
                    }
                },
                //通过监控hover，从而绑定a标签的draggable
                addHoverDom: (treeId, treeNode) => {
                    //获取li标签的id，再获取内部的a标签
                    let $node_a = $(`#${treeNode.tId}_a`);
                    $node_a.draggable({
                        scope: "perMatch",
                        zIndex: 998,
                        opacity: 0.8,
                        cursorAt: { top: 10, left: 10 },
                        appendTo: '.sourceTree',
                        helper: (event) => {
                            return $(event.target).clone();
                        },
                        drag: (event, ui) => {
                            //如果是已删除状态，禁止拖拽
                            if (treeNode.FieldStatus === 3) {
                                return false;
                            }

                        }
                    });
                }
            },
            edit: {
                //是否处于可编辑状态
                enable: true,
                //是否显示删除按钮
                showRemoveBtn: false,
                //是否显示重命名按钮
                showRenameBtn: false,
                //配置拖动
                drag: {
                    //是否可以copy
                    isCopy: false,
                    //是否可以移动(默认值也是true)
                    isMove: false
                }
            },
            data: {
                key: {
                    //重置name标识为FieldName
                    name: "FieldName",
                    //重置children标识为Children
                    children: "Children"
                },
                simpledata: {
                    enable: false,
                    //节点中唯一标识
                    idKey: "FieldID",
                    //父节点唯一标识
                    pIdKey: "FieldID"
                }
            },
            callback: {
                onDrop: (event, treeId, treeNodes, targetNode, moveType) => {
                },
                beforeDrop: null,
                //编辑树后回调函数
                onRename: (event, treeId, treeNode) => {
                    for (let i = 0; i < this.allTempTablesData.length; i++) {
                        if (this.allTempTablesData[i].TempororyTableID == treeNode.FieldID) {
                            this.allTempTablesData[i].TempororyTableName = $("#" + treeNode.tId + "_span").text();
                            this.mapping_service.updateTempTable(this.mapping_id, this.allTempTablesData[i].TempororyTableID, this.allTempTablesData[i]).subscribe(data => {
                                this.allTempTablesData[i].TempororyTableName = data.TempororyTableName;
                            });
                            break;
                        }
                    }
                },
                onClick: (event, treeId, treeNode) => {
                    if ($("#" + treeNode.tId + "_a").find(".editTempName").length > 0) {
                        this.anchorTempTable(event, treeNode.FieldID);
                    }
                    else {
                        return false;
                    }
                }
            }
        };
        //调用zTree初始化方法，开始渲染
        let temp = $.fn.zTree.init(dom, setting, treeData);
    }
}