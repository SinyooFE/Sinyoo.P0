/**
* Mapping筛选器设置页面
*/
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { QueryAuthorizeInfo, AuthorizeInfo, MappingService } from '../../services'

import { StudyFieldType, FieldStatisticType, MappingFieldStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class MappingMatchFilterContext extends BSModalContext {
    /**
     * 映射ID
     */
    mappingId: number;

    /**
     * sectionId
     */
    sectionId: number;

    /**
     * 临时表id
     */
    tempororyTableId: number;
    /**
     * 临时表sectionId
     */
    tempororyTableSectionId: number;

    /**
     * 是否临时表筛选
     */
    isTemporary: boolean;
}

@Component({
    // moduleId: module.id,
    selector: 'mapping-match-filter',
    styleUrls: ['mapping-match-filter.component.css'],
    templateUrl: 'mapping-match-filter.component.html'
})
export class MappingMatchFilterComponent implements CloseGuard, OnInit, AfterViewInit, ModalComponent<MappingMatchFilterContext> {
    //弹框参数集合
    context: MappingMatchFilterContext;

    //课题信息
    studyData = <server.StudyFieldInfoTreeViewModel>{};
    //筛选器详细信息
    filterDetail = <server.FilterViewModel>{};

    //树筛选
    searchTerms = new Subject<string>();
    //树Id
    sourceTreeId = 'filterSourceTree';
    //树对象
    zTreeObj = null;
    //QueryBuilder的ID
    queryBuilderId = 'filterQueryBuilder';
    //QueryBuilder对象
    queryBuilderObj = null;
    //QueryBuilder的Filters
    queryBuilderFilters = [];

    //筛选器类型
    filterTypeIsAdvance = false;
    //筛选器数组，深度为1，由filterDetail初始化而来
    filterRulesArray = [];

    constructor(private router: Router,
        public dialog: DialogRef<MappingMatchFilterContext>,
        public modal: Modal,
        public mappingService: MappingService) {

        dialog.context.dialogClass = 'modal-dialog mapping-filter-dialog';
        dialog.context.inElement = false;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
    }

    ngOnInit(): void {

    }

    ngAfterViewInit() {
        //参数判断
        if (this.context.isTemporary) {
            //临时表 要求tempororyTableId和tempororyTableSectionId
            if (_.isNil(this.context.tempororyTableId) || _.isNil(this.context.tempororyTableSectionId)) {
                this.showAlert('临时表参数不全！');
                return;
            }
        } else {
            //非临时表 要求sectionId
            if (_.isNil(this.context.sectionId)) {
                this.showAlert('参数不全！');
                return;
            }
        }

        let studyFieldObservable = this.mappingService.getFilterStudyField(this.context.mappingId);
        let filterObservable = this.context.isTemporary
            ? this.mappingService.getTemporaryFilter(this.context.mappingId, this.context.tempororyTableId, this.context.tempororyTableSectionId)
            : this.mappingService.getSectionFilter(this.context.mappingId, this.context.sectionId);

        Observable.forkJoin(studyFieldObservable, filterObservable)
            .subscribe((result) => {
                this.studyData = result[0];
                this.filterDetail = result[1];

                console.log(this.studyData);
                //初始化树
                this.initSourceTree();

                //筛选器类型
                this.filterTypeIsAdvance = this.filterDetail.AdvanceFilter;
                //初始化的rule设置
                if (!_.isNil(this.filterDetail.FilterJson) && this.filterDetail.FilterJson !== '') {
                    let tempRules = JSON.parse(this.filterDetail.FilterJson);
                    this.filterRulesArray = this.getRulesRecursive(tempRules.rules);
                }

                //初始化QueryBuilder
                this.initQueryBuilder();
            });

        //搜索
        this.searchTerms.debounceTime(1000).distinctUntilChanged()
            .subscribe(
            (data) => {
                if (!_.isNil(this.zTreeObj)) {
                    if (data === '') {
                        //收起树节点
                        this.zTreeObj.expandAll(false);
                        //所有隐蔽的节点显示出来
                        let hiddenNodes = this.zTreeObj.getNodesByParam('isHidden', true);
                        this.zTreeObj.showNodes(hiddenNodes);
                    } else {
                        //isSingle = true 返回 第一个找到的节点数据 JSON，无结果时返回 null
                        //isSingle = false 返回 节点数据集合 Array(JSON) ，无结果时返回[]
                        let searchNodes = this.zTreeObj.getNodesByFilter((node) => {
                            //返回所有需要显示的节点
                            if ((node.FieldType === StudyFieldType.普通字段 || node.FieldType === StudyFieldType.多选字段) && node.FieldName.indexOf(data) > -1) {
                                if (node.isHidden) {
                                    this.zTreeObj.showNode(node);
                                }
                                return true;
                            } else {
                                if (!node.isHidden) {
                                    this.zTreeObj.hideNode(node);
                                }
                                return false;
                            }
                        }, false);
                        //根据查找出来的节点，找出路径并全部显示
                        searchNodes.forEach((node, index, array) => {
                            if (node.isFirstNode) {
                                let path = node.getPath(node);
                                if (path.length > 0) {
                                    this.zTreeObj.showNodes(path);
                                }
                            }
                        });
                        //最后全部展开树节点
                        this.zTreeObj.expandAll(true);
                    }
                }
            });
    }

    /**
     * 初始化字段树
     */
    initSourceTree() {
        if (!_.isNil(this.studyData.Fields)) {
            let setting = {
                view: {
                    showLine: false,
                    showIcon: false,
                    addDiyDom: (treeId, treeNode) => {
                        //字段类型图标
                        let fieldIconHtml = '';
                        switch (treeNode.FieldType) {
                            case StudyFieldType.普通字段:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.普通字段]}" class="icon iconfont">&#xe68d;</span>`;
                                }; break;
                            case StudyFieldType.多选字段:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.多选字段]}" class="icon iconfont">&#xe66f;</span>`;
                                }; break;
                            case StudyFieldType.多选选项字段:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.多选选项字段]}" class="icon iconfont">&#xe620;</span>`;

                                }; break;
                            case StudyFieldType.访视字段:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.访视字段]}" class="icon iconfont">&#xe710;</span>`;
                                }; break;
                            case StudyFieldType.列表字段:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.列表字段]}" class="icon iconfont">&#xe66e;</span>`;
                                }; break;
                            case StudyFieldType.CRF表:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.CRF表]}" class="icon iconfont">&#xe629;</span>`;
                                }; break;
                            case StudyFieldType.Patient:
                                {
                                    fieldIconHtml = `<span title="${StudyFieldType[StudyFieldType.Patient]}" class="icon iconfont">&#xe61f;</span>`;
                                }; break;
                        }
                        let aObj = $(`#${treeNode.tId}_a`);
                        aObj.prepend(fieldIconHtml);

                        //字段状态内容
                        if (treeNode.FieldStatus === MappingFieldStatus.修改 || treeNode.FieldStatus === MappingFieldStatus.已删除) {
                            if (this.filterRulesArray.length > 0 && this.checkNodeCanDrag(treeNode)) {
                                if (_.findIndex(this.filterRulesArray, (item) => { return item.id === treeNode.FieldID; }) > -1) {
                                    aObj.append(`<div class="mappingMatch_Tip mappingMatch_sTip">${MappingFieldStatus[treeNode.FieldStatus]}</div>`);
                                };
                            }
                        }
                    },
                    addHoverDom: (treeId, treeNode) => {
                        //判断节点是否能拖拽
                        if (!this.checkNodeCanDrag(treeNode)) return;

                        let $eleA = $(`#${treeNode.tId}_a`);
                        $eleA.draggable({
                            scope: 'filter',
                            zIndex: 998,
                            opacity: 0.8,
                            cursorAt: { top: 10, left: 10 },
                            appendTo: '.filterMain',
                            helper: (event) => {
                                return $(event.target).clone();
                            }
                        });
                    }
                },
                data: {
                    key: {
                        name: "FieldName",
                        children: "Children"
                    },
                    simpledata: {
                        enable: false,
                        idKey: "FieldID",
                        pIdKey: "ParentFieldID"
                    }
                }
            };
            //调用zTree初始化方法，开始渲染
            this.zTreeObj = $.fn.zTree.init($(`#${this.sourceTreeId}`), setting, this.studyData.Fields);
            //生成QueryBuilder的Filters
            this.generateQueryBuilderRules();
        }
    }

    /**
     * 初始化QueryBuilder
     * @param isChangeFilterType
     */
    initQueryBuilder(isChangeFilterType = false) {
        //字段检查
        if (this.queryBuilderFilters.length === 0) {
            this.showAlert('该课题没有可以操作的字段！');
            return;
        }

        let qbRules = null;
        if (isChangeFilterType && !_.isNil(this.queryBuilderObj)) {
            let arrayRules = [];
            let tempRules = this.queryBuilderObj.queryBuilder('getRules', { allow_invalid: true });
            //console.log(tempRules);
            if (!_.isNil(tempRules)) {
                arrayRules = this.getRulesRecursive(tempRules.rules);
            }
            if (arrayRules.length > 0) {
                qbRules = { condition: 'AND', rules: arrayRules };
            }
        } else {
            //初始化的rule设置
            if (this.filterRulesArray.length > 0) {
                qbRules = JSON.parse(this.filterDetail.FilterJson);
            }
        }

        let options = {
            allow_empty: true,
            allow_groups: this.filterTypeIsAdvance,
            conditions: this.filterTypeIsAdvance ? ['AND', 'OR'] : ['AND'],
            filters: this.queryBuilderFilters,
            rules: qbRules
        };

        if (!_.isNil(this.queryBuilderObj)) {
            this.queryBuilderObj.queryBuilder('destroy');
        }
        //QueryBuilder事件
        $(`#${this.queryBuilderId}`).on({
            'afterAddGroup.queryBuilder': (event, group) => {
                //console.log(event);
                //console.log(group);
                //初始化可拖拽
                this.initDroppable($(`#${this.queryBuilderId} #${group.id}`));
            },
            'afterAddRule.queryBuilder': (event, rule) => {
                //console.log(event);
                //console.log(rule);
                //初始化可拖拽
                this.initDroppable($(`#${this.queryBuilderId} #${rule.id}`));
            },
            'afterCreateRuleFilters.queryBuilder': (event, rule) => {
                //console.log(rule);
                $(`#${this.queryBuilderId} #${rule.id}`).find('.rule-filter-container [name$=_filter]').prop('disabled', true);
            },
            'afterUpdateRuleFilter.queryBuilder': (event, rule) => {
                console.log(rule);
                //添加点击事件，定位树位置
                let $ele = $(`#${this.queryBuilderId} #${rule.id}`);
                $ele.on('click', (event) => {
                    if (!_.isNil(rule.filter)) {
                        let treeNode = this.zTreeObj.getNodeByParam("FieldID", rule.filter.id);
                        if (!_.isNil(treeNode)) {
                            this.zTreeObj.selectNode(treeNode);
                        }
                    }
                });
            }
        });
        this.queryBuilderObj = $(`#${this.queryBuilderId}`).queryBuilder(options);
        //console.log(this.queryBuilderObj);
    }

    /**
     * 初始化droppable
     * @param $ele
     */
    initDroppable($ele: JQuery) {
        if (_.isNil($ele.droppable("instance"))) {
            $ele.droppable({
                scope: 'filter',
                greedy: true,
                drop: (event, ui) => {
                    //QueryBuilder元素id
                    let targetId = event.target.id;
                    //拖拽的节点信息
                    let treeNode = this.zTreeObj.getNodeByTId(ui.draggable.parent('li').attr('id'));
                    //console.log(ui.draggable.parent('li').attr('id'));
                    //console.log(treeNode);

                    if (!this.checkNodeCanAddToQueryBuilder(treeNode)) {
                        this.showAlert('不能添加不同列表的字段！');
                        return;
                    }

                    let currentRule = null;
                    if (targetId.indexOf('_rule_') > -1) {
                        //如果拖拽到规则dom,更新规则为当前字段
                        currentRule = this.queryBuilderObj.queryBuilder('getModel', $(`#${targetId}`));
                    } else if (targetId.indexOf('_group_') > -1) {
                        //如果拖拽到分组dom,则在group下添加一条规则，并选中当前字段
                        let parentGroup = this.queryBuilderObj.queryBuilder('getModel', $(`#${targetId}`));
                        currentRule = this.queryBuilderObj.queryBuilder('addRule', parentGroup);
                    }

                    let tempFilter = this.queryBuilderObj.queryBuilder("getFilterById", treeNode.FieldID);
                    if (!_.isNil(currentRule) && !_.isNil(tempFilter)) {
                        if (tempFilter.input === 'select' && (_.isNil(tempFilter.values) || tempFilter.values.length === 0)) {
                            this.mappingService.getFieldItems(this.context.mappingId, this.context.sectionId, <string>tempFilter.id)
                                .subscribe((data) => {
                                    if (data.length > 0) {
                                        //更新filter的values
                                        tempFilter.values = data;
                                        //更新queryBuilderFilters，避免切换模式的情况下，丢失选项值
                                        _.find(this.queryBuilderFilters,
                                            (item) => {
                                                if (item.id === tempFilter.id) {
                                                    item.values = data;
                                                    return true;
                                                }
                                                return false;
                                            });
                                    } else {
                                        this.showAlert('未查询到该字段的选项');
                                    }

                                    //给当前rule赋值filter
                                    currentRule.filter = tempFilter;
                                    //给当前rule赋值操作符
                                    currentRule.operator = this.queryBuilderObj.queryBuilder("getOperatorByType", "equal");

                                });
                        } else {
                            currentRule.filter = tempFilter;
                            currentRule.operator = this.queryBuilderObj.queryBuilder("getOperatorByType", "equal");
                        }
                    }
                }
            });
        }
    }

    /**
     * 检测树节点是否能拖拽
     * @param treeId
     * @param treeNode
     */
    checkNodeCanDrag(treeNode): boolean {
        return treeNode.FieldType === StudyFieldType.多选字段
            || treeNode.FieldType === StudyFieldType.普通字段
            || treeNode.FieldType === StudyFieldType.访视字段;
    }

    /**
     * 检查节点是否可以加入QueryBuilder
     * 主要限制不同列表的字段
     * @param treeNode
     */
    checkNodeCanAddToQueryBuilder(treeNode): boolean {
        if (_.isNil(treeNode) || _.isNil(treeNode.ParentFieldID) || treeNode.ParentFieldID === '0') return false;

        //如果treeNode的父节点不是列表字段，验证通过
        let parentTreeNode = treeNode.getParentNode();
        if (!_.isNil(parentTreeNode) && parentTreeNode.FieldType !== StudyFieldType.列表字段) return true;

        //不存在筛选条件，验证通过
        let tempRules = this.queryBuilderObj.queryBuilder('getRules', { allow_invalid: true });
        //清除错误提示信息
        this.queryBuilderObj.queryBuilder('clearErrors');
        if (_.isNil(tempRules)) return true;
        //不存在筛选条件，验证通过
        let arrayRules = this.getRulesRecursive(tempRules.rules);
        if (arrayRules.length === 0) return true;

        //rule.id数组
        let arrayTreeNodeId = _.map(arrayRules, 'id');
        //树节点集合,采用循环按照FieldID得到treeNode，不知道这两种哪种效率高（也可以通过树的过滤方法）
        let arrayTreeNode = [];
        arrayTreeNodeId.forEach((fieldId) => {
            let tempNode = this.zTreeObj.getNodeByParam('FieldID', fieldId, null);
            if (!_.isNil(tempNode)) {
                arrayTreeNode.push(tempNode);
            }
        });
        //树节点的父节点id数组(第一级)
        let arrayTreeNodeParentId = _.uniq(_.map(arrayTreeNode, 'ParentFieldID'));
        //父级树 列表字段 节点集合
        let arrayTreeNodeListParent = this.zTreeObj.getNodesByFilter((node) => {
            return node.FieldType === StudyFieldType.列表字段 &&
                arrayTreeNodeParentId.indexOf(node.FieldID) > -1;
        });

        //如果不包含任何列表，验证通过
        if (arrayTreeNodeListParent.length === 0) return true;
        //只有一个列表，满足父子级关系即可
        //两个列表,parentTreeNode必定是其中一个
        if (arrayTreeNodeListParent.length === 1) {
            //互为父子集的情况，父级相同，验证通过
            return (arrayTreeNodeListParent[0].ParentFieldID === parentTreeNode.FieldID ||
                parentTreeNode.ParentFieldID === arrayTreeNodeListParent[0].FieldID ||
                parentTreeNode.FieldID === arrayTreeNodeListParent[0].FieldID);
        } else if (arrayTreeNodeListParent.length === 2) {
            return (arrayTreeNodeListParent[0].FieldID === parentTreeNode.FieldID ||
                arrayTreeNodeListParent[1].FieldID === parentTreeNode.FieldID);
        }

        return false;
    }

    /**
     * 初始化树后，一次性生成QueryBuilder的Rule集合,保存到queryBuilderFilters
     */
    generateQueryBuilderRules() {
        if (!_.isNil(this.zTreeObj)) {
            let canDragNodes = this.zTreeObj.getNodesByFilter(this.checkNodeCanDrag, false);
            if (canDragNodes.length > 0) {
                canDragNodes.forEach((value, index, array) => {
                    //已有的话，不需要加入
                    if (_.findIndex(this.queryBuilderFilters, (item) => { return item.id === value.FieldID; }) > -1) {
                        return true;
                    }

                    let tempRule = {
                        id: value.FieldID,
                        field: `[${value.TName}].[${value.FName}]`,  //TName+FName
                        label: value.FieldName,
                        input: null,
                        type: '',
                        operators: [],
                        values: null,
                        validation: null,
                        multiple: false,
                        plugin: null,
                        plugin_config: null,
                        callback: null
                    };
                    switch (value.FieldStatisitcType) {
                        case FieldStatisticType.连续型:
                            {
                                tempRule.type = 'double';
                                tempRule.validation
                                tempRule.operators = [
                                    'equal', 'not_equal',
                                    'less', 'less_or_equal',
                                    'greater', 'greater_or_equal',
                                    'between', 'not_between',
                                    'is_empty', 'is_not_empty',
                                    'is_null', 'is_not_null'
                                ];
                            }; break;
                        case FieldStatisticType.二分类:
                        case FieldStatisticType.有序分类:
                        case FieldStatisticType.无序分类:
                        case FieldStatisticType.多选分类:
                            {
                                tempRule.type = 'string';
                                tempRule.multiple = true;
                                tempRule.input = 'select';
                                tempRule.plugin = 'selectpicker';
                                tempRule.plugin_config = {
                                    noneSelectedText: '请选择...'
                                };
                                tempRule.operators = [
                                    'equal', 'not_equal',
                                    'in', 'not_in',
                                    'contains', 'not_contains',
                                    'is_empty', 'is_not_empty',
                                    'is_null', 'is_not_null'
                                ];
                                if (!_.isNil(this.filterDetail.FieldItems) && !_.isNil(this.filterDetail.FieldItems[value.FieldID])) {
                                    tempRule.values = this.filterDetail.FieldItems[value.FieldID];
                                }
                            }; break;
                        case FieldStatisticType.生存时间:
                        case FieldStatisticType.日期型:
                            {
                                tempRule.type = 'date';
                                tempRule.plugin = 'datepicker';
                                tempRule.plugin_config = {
                                    language: 'zh-CN',
                                    format: 'yyyy/mm/dd',
                                    todayBtn: 'linked',
                                    todayHighlight: true,
                                    autoclose: true
                                };
                                tempRule.validation = {
                                    format: 'YYYY/MM/DD'
                                };
                                tempRule.operators = [
                                    'equal', 'not_equal',
                                    'less', 'less_or_equal',
                                    'greater', 'greater_or_equal',
                                    'between', 'not_between',
                                    'is_empty', 'is_not_empty',
                                    'is_null', 'is_not_null'
                                ];
                            }; break;
                        default:
                            {
                                tempRule.type = 'string';
                                tempRule.operators = [
                                    'equal', 'not_equal',
                                    'contains', 'not_contains',
                                    'is_empty', 'is_not_empty',
                                    'is_null', 'is_not_null'
                                ];
                            }; break;;
                    }
                    this.queryBuilderFilters.push(tempRule);
                });
            }
        }
    }

    /**
     * 得到rules，且深度为1
     * @param rules
     */
    getRulesRecursive(rules) {
        if (_.isNil(rules) || !_.isArray(rules)) return [];

        let res = [];
        for (let i = 0; i < rules.length; i++) {
            if (rules[i]["rules"]) {
                res = res.concat(this.getRulesRecursive(rules[i]["rules"]));
            } else {
                if (!_.isNil(rules[i]["id"])) {
                    res.push(rules[i]);
                }
            }
        }
        return res;
    }

    /**
     * 筛选器普通高级模式切换
     */
    changeFilterType() {
        this.modal.confirm()
            .title('警告')
            .message('确定要切换编辑模式吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open()
            .then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.filterTypeIsAdvance = !this.filterTypeIsAdvance;
                        this.initQueryBuilder(true);
                    }
                }).catch(() => { });
            });
    }

    /**
     * 搜索
     * @param searchKey
     */
    searchSourceField(searchKey: string) {
        this.searchTerms.next(searchKey);
    }

    /**
     * 确认提交
     */
    ok() {
        if (!this.queryBuilderObj.queryBuilder('validate')) {
            this.showAlert('请先完善筛选条件！');
            return;
        }

        let qbRules = this.queryBuilderObj.queryBuilder('getRules');
        let sqlResult = this.queryBuilderObj.queryBuilder('getSQL', false);
        this.filterDetail = <server.FilterViewModel>{
            FilterJson: JSON.stringify(qbRules),
            SqlScript: sqlResult.sql,
            AdvanceFilter: this.filterTypeIsAdvance
        };
        //console.log(this.filterDetail);

        if (this.context.isTemporary) {
            this.mappingService.updateTemporaryFilter(this.context.mappingId, this.context.tempororyTableId, this.context.tempororyTableSectionId, this.filterDetail)
                .subscribe((data) => {
                    //console.log(data);
                    this.dialog.close({ IsOk: true, IsAdd: this.filterDetail.SqlScript !== '' });
                });
        } else {
            this.mappingService.updateSectionFilter(this.context.mappingId, this.context.sectionId, this.filterDetail)
                .subscribe((data) => {
                    //console.log(data);
                    this.dialog.close({ IsOk: true, IsAdd: this.filterDetail.SqlScript !== '' });
                });
        }
    }

    cancel() {
        this.dialog.close({ IsOk: false });
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
