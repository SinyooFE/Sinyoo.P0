import * as server from 'crabyter-p0-server/ViewModel';

export class OptionsModel {
    Options: OptionItem[] = [];


    public toString() {
        let ret: string = "";
        let isAllSelected: boolean = true;
        for (let opt of this.Options) {
            if (opt.isSelected) {
                ret += opt.key + ",";
            } else {
                isAllSelected = false;
            }
        }
        //如果是全选,那么返回空字符串,不需要过滤.
        return isAllSelected ? "" : ret;
    }
}

export class OptionItem {
    public key: string;
    public value: string;
    public isSelected: boolean;
}

export class CopyDomainInfo implements server.S_DomainViewModel {
    /** 域ID */
    ID: number;
    /** 版本表外键 */
    StandardID: number;
    /** 域名称 */
    DomainName: string;
    /** 序号 */
    Sort: number;
    /** 拥有的变量数量 */
    FieldsCount: number;
    /** 批准状态 */
    ApprovedStatus: any;
    DataStatus: any;
    /**
     * 选中状态0未选中，1部分选择，2全选
     */
    SelectedStatus: number;
    IsOwner: boolean;

    init(): void {

    }
}

/**
 * 选中的变量信息
 */
export class CopyFieldInfo implements server.S_FieldViewModel {
    /** 变量ID */
    ID: number;
    /** 域设置表外键 */
    DomainID: number;
    /** 变量标签 */
    FieldLabel: string;
    /** 变量名称 */
    FieldName: string;
    /** CRF中文填写指南 */
    FieldGuide: string;
    /** 变量标签 */
    FieldLabelEn: string;
    /** 序号 */
    Sort: number;
    /** 批准状态 */
    ApprovedStatus: any;
    /** 域名称 */
    DomainName: string;
    DataStatus: any;

    /**
     * 选中状态
     */
    IsSelected: boolean;
    IsOwner: boolean;

    init(): void {

    }
}

export class SelectedFieldInfo {
    standardId: number;
    standardName: string;

    domainId: number;
    domainName: string;

    variableId: number;
    variableName: string;
}

/**
 * 标准字段无法枚举的选项值
 */
export class FieldCannotEnumOptions {
    FieldDateFormat: Array<string>;

    constructor() {
        //日期格式
        this.FieldDateFormat = new Array<string>();
        this.FieldDateFormat = this.FieldDateFormat.concat([
            'yyyy-mm',
            'yyyy-mm-dd',
            'yyyy-mm-dd hh:mm:ss',
            'yyyy年mm月',
            'yyyy年mm月dd日',
            'yyyy年mm月dd日hh时mm分ss秒',
            'hh:mm:ss',
            'hh时mm分ss秒',
            'hh:mm',
            'hh时mm分'
        ]);
    }
}



