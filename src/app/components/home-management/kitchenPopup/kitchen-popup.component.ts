import { Component, OnInit, AfterViewInit, Inject, ViewEncapsulation } from '@angular/core';
import { Options } from 'ng5-slider';

import * as _ from 'lodash';
import { MAT_DIALOG_DATA } from '@angular/material';
import { DeviceModel } from 'app/models/DeviceModel';
import { LanguageService } from 'app/services/language.service';

@Component({
  selector: 'app-kitchen-popup',
  templateUrl: './kitchen-popup.component.html',
  styleUrls: ['./kitchen-popup.component.scss'],

})
export class KitchenPopupComponent implements OnInit, AfterViewInit {
  public controlDevices: DeviceModel[];
  public controlDevice: DeviceModel = new DeviceModel();
  public senseDevices: DeviceModel[];
  public temperatureOptions: Options;
  public humidityOptions: Options;
  public coOptions: Options;
  public ch4Options: Options;
  public smokeOptions: Options;
  public mobileTemperatureOptions: Options;
  public mobileHumidityOptions: Options;
  public mobileCoOptions: Options;
  public mobileCh4Options: Options;
  public mobileSmokeOptions: Options;
  public defaultControlDevice: DeviceModel;
  public temperatureValue: any;
  public humidityValue: number = 0;
  public limit_temperature: any;
  public limit_humidity: any;
  public limit_smoke: any;
  public limit_co: any;
  public limit_ch4: any;


  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public ls: LanguageService
  ) { }

  ngOnInit() {
    this.controlDevices = this.data.controlDevices;
    this.defaultControlDevice = this.controlDevices[0];
    console.log("aici", this.controlDevices)

    this.changeControlDevice(this.defaultControlDevice)
  }
  changeControlDevice(device: DeviceModel) {
    this.controlDevice = device;
    this.limit_temperature = parseInt(localStorage.getItem('temperature_limit'))
    this.limit_humidity = parseInt(localStorage.getItem('humidity_limit'))
    this.limit_ch4 = parseInt(localStorage.getItem('ch4_limit'))
    this.limit_smoke = parseInt(localStorage.getItem('smoke_limit'))
    this.limit_co = parseInt(localStorage.getItem('co_limit'))
    console.log(this.limit_temperature, this.limit_humidity)

    this.temperatureOptions = {
      floor: -30,
      ceil: 50,
      vertical: true
    };
    this.humidityOptions = {
      floor: 0,
      ceil: 100,
      vertical: true
    };
    this.ch4Options = {
      floor: 0,
      ceil: 1000,
      vertical: true
    };
    this.coOptions = {
      floor: 0,
      ceil: 1000,
      vertical: true
    };
    this.smokeOptions = {
      floor: 0,
      ceil: 1000,
      vertical: true
    };

    //mobile options for slider
    this.mobileTemperatureOptions = {
      floor: -30,
      ceil: 50,
      vertical: false
    };
    this.mobileHumidityOptions = {
      floor: 0,
      ceil: 100,
      vertical: false
    };
    this.mobileCh4Options = {
      floor: 0,
      ceil: 1000,
      vertical: false
    };
    this.mobileCoOptions = {
      floor: 0,
      ceil: 1000,
      vertical: false
    };
    this.mobileSmokeOptions = {
      floor: 0,
      ceil: 1000,
      vertical: false
    };

  }
  ngAfterViewInit() {

  }
  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    } else {

    }
    return true;
  };
  changeTemperatureLimit() {
    localStorage.setItem("temperature_limit", this.limit_temperature.toString())
  }
  changeSmokeLimit() {
    localStorage.setItem("smoke_limit", this.limit_smoke.toString())
  }
  changeCoLimit() {
    localStorage.setItem("co_limit", this.limit_co.toString())
  }
  changeCh4Limit() {
    localStorage.setItem("ch4_limit", this.limit_ch4.toString())
  }
  changeHumidityLimit() {
    localStorage.setItem("humidity_limit", this.limit_humidity.toString())
  }
  closeWindow() {
  }
  openWindow() {
  }
}
