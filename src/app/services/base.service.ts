import { Injectable, EventEmitter, ViewContainerRef, Output } from '@angular/core';
import { Headers, Http, Response, RequestOptions } from '@angular/http';

import { Observable, Subscription, Subject, ReplaySubject } from 'rxjs';

import { AuthenicationService } from './authenication'

import { BaseUrl } from '../environment';

import _ from 'lodash';

@Injectable()
export class BaseService {
    //错误报告
    @Output() errorReport = new EventEmitter<string>();
    //等待报告
    @Output() busyReport = new EventEmitter<Subscription>();
    /**
     * 内容区域高度 = 浏览器高度 - 80(顶部高度)
     */
    contentHeight = new ReplaySubject<number>(1);

    /* 开发*/
    private rootUrl: string = BaseUrl;

    constructor(private requestHttp: Http, private authenication: AuthenicationService) {
        if ((<any>window).p0ApiUrl) {//如果p0ApiUrl有定义
            this.rootUrl = (<any>window).p0ApiUrl;
        }
    }

    /**
     * search
     * @param url
     */
    search(url: string, options?: RequestOptions): Observable<any> {
        let temp = this.requestHttp.get(this.getServiceAddress(url), { headers: this.authenication.getHeader() })
            .map((rep) => rep.json())
            .catch((error) => {
                return this.handleServerError(error);
            }).share();
        this.busyReport.emit(temp.subscribe());
        return temp;
    }

    /**
     * post
     */
    post(url: string, body?: any, options?: RequestOptions): Observable<any> {
        let temp = this.requestHttp.post(this.getServiceAddress(url),
            body,
            { headers: this.authenication.getHeader() })
            .map((rep) => rep.json())
            .catch((error) => {
                return this.handleServerError(error);
            }).share();
        this.busyReport.emit(temp.subscribe());
        return temp;
    }

    /**
     * put
     * @param url
     * @param body
     */
    put(url: string, body?: any): Observable<any> {
        let temp = this.requestHttp.put(this.getServiceAddress(url),
            body,
            { headers: this.authenication.getHeader() })
            .map((rep) => rep.json())
            .catch((error) => {
                return this.handleServerError(error);
            }).share();
        this.busyReport.emit(temp.subscribe());
        return temp;
    }

    /**
     * get
     * @param url
     */
    get(url: string): Observable<any> {
        let temp = this.requestHttp.get(this.getServiceAddress(url),
            { headers: this.authenication.getHeader() })
            .map((rep) => rep.json())
            .catch((error) => {
                return this.handleServerError(error);
            }).share();
        this.busyReport.emit(temp.subscribe());
        return temp;
    }

    /**
     * delete
     * @param url
     */
    delete(url: string): Observable<any> {
        let temp = this.requestHttp.delete(this.getServiceAddress(url),
            { headers: this.authenication.getHeader() })
            .catch((error) => {
                return this.handleServerError(error);
            }).share();
        this.busyReport.emit(temp.subscribe());
        return temp;
    }

    /**
     * 请求完整地址
     * @param serviceUrl
     */
    private getServiceAddress(serviceUrl: string): string {
        return `${this.rootUrl}${serviceUrl}`;
    }

    /**
     * 出错处理
     * @param error
     */
    private handleServerError(error: any) {
        console.log(error);
        this.busyReport.emit(null);

        let errMessage = '';
        const errNo = +error.status;
        if (errNo < 200 || errNo >= 300) {
            switch (errNo) {
                case 400:
                    {
                        errMessage = error.json().Message;
                    };
                    break;
                case 401:
                    {
                        errMessage = '请先登录！';
                    };
                    break;
                case 403:
                    {
                        errMessage = '无权限！请联系管理员！';
                    };
                    break;
                case 404:
                    {
                        errMessage = '找不到！';
                    };
                    break;
                case 500:
                    {
                        errMessage = _.isNil(error.json().ExceptionMessage)
                            ? '内部错误，稍后再试！'
                            : error.json().ExceptionMessage;
                    };
                    break;
                default:
                    {
                        errMessage = 'Some Server Error.';
                    };
                    break;
            }
            //异常报告
            this.errorReport.emit(errMessage);
        }
        return Observable.from(error);
    }
}


@Injectable()
export class LocalStorageOperateService {


}