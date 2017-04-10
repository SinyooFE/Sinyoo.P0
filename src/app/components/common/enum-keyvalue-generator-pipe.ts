import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'enumKeyValues' })
export class enumKeyValuesPipe implements PipeTransform {
    transform(value, args: string[]): any {
        let keys = [];
        //默认包含=0的值
        const isIncludeZero = parseInt((args === undefined ? '1' : args[0]), 10) >= 1;
        for (let enumMember in value) {
            let isValueProperty = parseInt(enumMember, 10) >= 0;
            if (isValueProperty) {
                if (parseInt(enumMember, 10) === 0 && !isIncludeZero) {
                    continue;
                }
                keys.push({ key: enumMember, value: value[enumMember] });
            }
        }
        return keys;
    }
}
