import { Pipe, PipeTransform } from '@angular/core';

/**
 * 把数字转换为从1开始的数字数组,包含最后数字
 */
@Pipe({ name: 'numToArray' })
export class numToArrayPipe implements PipeTransform {
    transform(value, args: string[]): any {
        let res = [];
        for (let i = 1; i <= value; i++) {
            res.push(i);
        }
        return res;
    }
}