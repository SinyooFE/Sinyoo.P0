import { Http } from "@angular/http";
import { Injectable } from "@angular/core";
import { Response } from "@angular/http";

//import { ExceptionlessClient } from 'exceptionless';

@Injectable()
export class ErrorLogService {

    //不明白为什么d.ts没用,老是说找不到文件
    // private client: ExceptionlessClient = null;
    //private client: ExceptionlessClient = ExceptionlessClient.default;

    private http: Http;

    constructor(http: Http) {
        this.http = http;
        // if ((<any>window).exceptionlessKey) {
        //     this.client = new ExceptionlessClient((<any>window).exceptionlessKey, (<any>window).exceptionlessUrl);
        // } else {
        //     this.client = new ExceptionlessClient('hm5xYiV0NTsw0cteaLONZ6SfDhxnYLaWLc1Dvjfn', 'http://192.168.20.251:8129');
        // }
        // this.client.config.defaultTags.push('P0 Front', 'Ng2');
        // this.client.config.useDebugLogger();

        // set some default data
        /*this.client.config.defaultData['SampleUser'] = {
            id: 1,
            name: 'Blake',
            password: '123456',
            passwordResetToken: 'a reset token',
            myPasswordValue: '123456',
            myPassword: '123456',
            customValue: 'Password',
            value: {
                Password: '123456'
            }
        };*/
    }

    /**
     * 提交日志记录
     * @param message
     */
    public submitLog(message: string) {
        //this.client.submitLog(message);
    }

    /**
     * 提交异常记录
     * @param error
     */
    public submitException(error: Error) {

        //this.client.submitException(error);
    }
    /**
     * 记录错误信息到网页console,同时记录到exceptionless
     * @param error
     */
    logError(error: Error): void {
        this.submitException(error);
        this.sendToConsole(error);
    }

    private sendToConsole(error: Error): void {
        if (console && console.group && console.error) {
            console.group("Error Log Service");
            //console.error(error);
            console.error(error.message);
            console.error(error.stack);
            console.groupEnd();
        }
    }
}