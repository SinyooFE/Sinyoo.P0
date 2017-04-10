import { Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'mappingRules' })
export class mappingRulesPipe implements PipeTransform {
    transform(rules, args: string[]): any {
        //ID的类型
        let idArray = [];
        //新的数据
        let newRules = []
        //遍历所有某个Mapping分组的rules，需要传入rules
        for (let i = 0; i < rules.length; i++) {
            //第一条数据肯定是新的id，push进idArray[]
            if (i === 0) {
                idArray.push(rules[i].SourceTableID);
                newRules.push({ "SourceTableID": rules[0].SourceTableID, "SourceTableName": rules[0].SourceTableName, Rules: [] });
            }
            //不是第一条，则遍历idArray[]，看是否有重复的id，如果没有，则再push进去，最后得到 没有重复id的——idArray[不重复id]
            else {
                for (let j = 0; j < idArray.length; j++) {
                    if (idArray.indexOf(rules[i].SourceTableID) === -1) {
                        idArray.push(rules[i].SourceTableID);
                        newRules.push({ "SourceTableID": rules[i].SourceTableID, "SourceTableName": rules[i].SourceTableName, Rules: [] });
                    }
                }
            }
        }
        //再次遍历传进来的rules，只要匹配了id则放进去
        for (let i = 0; i < rules.length; i++) {
            for (let j = 0; j < newRules.length; j++) {
                if (newRules[j].SourceTableID === rules[i].SourceTableID) {
                    newRules[j].Rules.push(rules[i]);
                }
            }
        }
        /*
            修改后的新Rules结构，通过SourceTableID分组了。
            Tables:
            [
                {"SourceTableID":1,"SourceTableName":"XXX",Rules[{第一行},{第二行}]},
                {"SourceTableID":2,"SourceTableName":"YYY",Rules[{第一行},{第二行}]}
            ] 
        */
        console.log("管道返回");
        return newRules;
    }
}
