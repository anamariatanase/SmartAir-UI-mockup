import { Component, OnInit, AfterViewInit, ViewChild, EventEmitter, Output, Input, OnChanges } from "@angular/core";
import * as Chartist from "chartist";
import { DeviceModel } from "../../models/DeviceModel";
import { ReadingModel } from "../../models/ReadingModel";
import { bindNodeCallback, throwError, Subscription } from "rxjs";
import { getMatAutocompleteMissingPanelError, MatDialog } from "@angular/material";
import { ChartType, ChartDataSets, ChartOptions } from "chart.js";
import {
  Label,
  SingleDataSet,
  monkeyPatchChartJsTooltip,
  monkeyPatchChartJsLegend,
} from "ng2-charts";
import { single } from "rxjs/operators";
import { IMqttMessage } from "ngx-mqtt";
import { ValuesModel } from "app/models/ValuesModel";
import { UtilsService } from "app/services/utils.service";
import * as _ from 'lodash';
import { LanguageService } from "app/services/language.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
  styles: [
    `
      .chart {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private devices: DeviceModel[] = [
    {
      active: true,
      username: 'x',
      type: 'sense',
    },
    {
      active: true,
      username: 'y',
      type: 'sense',
    },
    {
      active: true,
      username: 'z',
      type: 'control',
    },
    {
      active: true,
      username: 't',
      type: 'sense',
    },
    {
      active: true,
      username: 'm',
      type: 'control',
    },
    {
      active: true,
      username: 'o',
      type: 'control',
    },
  ];

  public senseDevices: DeviceModel[];
  public controlDevices: DeviceModel[];
  private defaultSenseDevice: DeviceModel;
  public defaultBarDeviceUsername;
  public defaultLeftDeviceUsername;
  public defaultRightDeviceUsername;
  private defaultControlDevice: DeviceModel;
  private leftSenseDevice: DeviceModel = new DeviceModel();
  private rightSenseDevice: DeviceModel = new DeviceModel();
  private barSenseDevice: DeviceModel = new DeviceModel();

  private dayLabels: string[] = _.initial(Array.from({ length: 24 }, (x, i) => i).map(n => n.toString() + "h ago").reverse()).concat(["new Date()"]);
  private monthLabels: string[] = _.initial(Array.from({ length: 31 }, (x, i) => i).map(n => n.toString() + " days ago").reverse());

  public numberOfUserDevices: number;

  private leftChartTemperatureData: number[] = [];
  private leftChartHumidityData: number[] = [];

  private rightChartCarbonMonoxideData: number[] = [];
  private rightChartMetaneData: number[] = [];
  private rightChartSmokeData: number[] = [];

  private barChartPressureData: number[] = [];

  public oneWeekLeftChartLabels: Array<any>;

  public leftChartType: string;
  public leftChartOptions: any;
  public leftChartDatasets: Array<any>;
  public leftChartLabels: Array<any>;
  public leftChartColors: Array<any>;

  public rightChartType: string;
  public rightChartOptions: any;
  public rightChartDatasets: Array<any>;
  public rightChartLabels: Array<any>;
  public rightChartColors: Array<any>;

  public barChartDatasets: Array<any>;
  public barChartLabels: Array<any>;
  public barChartColors: Array<any>;
  public barChartOptions: any;
  public barChartType: string;

  public pieChartDatasets: Array<any>;
  public pieChartLabels: Array<any>;
  public pieChartColors: Array<any>;
  public pieChartOptions: any;
  public pieChartType: string;

  constructor(
    private utilsService: UtilsService,
    public ls: LanguageService,
  ) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
  }

  ngOnInit() {
    this.handleLeftChartStatics();
    this.handleRightChartStatics();
    this.handleBarChartStatics();
    this.numberOfUserDevices = this.devices.length;
    console.log("The user has " + this.numberOfUserDevices + " devices");
  }

  ngAfterViewInit() {
    this.categorizeDevices();
    this.senseDevices.sort();
    this.defaultSenseDevice = this.senseDevices[0];
    this.defaultControlDevice = this.controlDevices[0]
    console.log("Default device is set to", this.defaultSenseDevice);
    this.staticChartsView();
  }

  categorizeDevices(): void {
    this.senseDevices = [];
    this.controlDevices = [];
    this.devices.forEach((device) => {
      if (device.type === 'sense') {
        this.senseDevices.push(device);
      } else if (device.type === 'control') {
        this.controlDevices.push(device);
      }
    });
  }

  setLeftChartPeriod(period: string) {
    this.emptyLeftChartValues();
    switch (period) {
      case "1y":
        this.setLeftChartToYear();
        break;
      case "1m":
        this.setLeftChartToMonth();
        break;
      case "7d":
        this.setLeftChartToWeek();
        break;
      case "1d":
        this.setLeftChartToDay();
        break;
    }
  }

  setLeftChartToDay(): void {
    for(let i =0; i<=23;i++){
      this.leftChartHumidityData.push(Math.floor(Math.random() * 24));
      this.leftChartTemperatureData.push(Math.floor(Math.random() * 24))
    }
   // this.leftChartHumidityData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
   // this.leftChartTemperatureData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

    this.leftChartLabels = this.dayLabels;
    this.leftChartDatasets = [
      { data: this.leftChartHumidityData, label: "Humidity" },
      { data: this.leftChartTemperatureData, label: "Temperature" },
    ];
  }

  setLeftChartToWeek(): void {
    let lastDayIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay()
    );
    let lastTwoDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 48 * 60 * 60 * 1000).getDay()
    );
    let lastThreeDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 72 * 60 * 60 * 1000).getDay()
    );
    let lastFourDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 96 * 60 * 60 * 1000).getDay()
    );
    let lastFiveDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 120 * 60 * 60 * 1000).getDay()
    );
    let lastSixDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 144 * 60 * 60 * 1000).getDay()
    );
    let lastSevenDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 168 * 60 * 60 * 1000).getDay()
    );

    let dayIndexes = [
      lastSevenDaysIndex,
      lastSixDaysIndex,
      lastFiveDaysIndex,
      lastFourDaysIndex,
      lastThreeDaysIndex,
      lastTwoDaysIndex,
      lastDayIndex,
    ];

    this.leftChartLabels = dayIndexes.map((dayIndex) =>
      this.getDayNameFromIndex(dayIndex)
    );

    for(let i =0; i<=7;i++){
      this.leftChartHumidityData.push(Math.floor(Math.random() * 7));
      this.leftChartTemperatureData.push(Math.floor(Math.random() * 7))
    }

    this.leftChartDatasets = [
      { data: this.leftChartHumidityData, label: "Humidity" },
      { data: this.leftChartTemperatureData, label: "Temperature" },
    ];
  }

  getDayNameFromIndex(dayIndex: number) {
    switch (dayIndex) {
      case 0:
        return "MONDAY";
      case 1:
        return "TUESDAY";
      case 2:
        return "WEDNESDAY";
      case 3:
        return "THURSDAY";
      case 4:
        return "FRIDAY";
      case 5:
        return "SATURDAY";
      case 6:
        return "SUNDAY";
    }
  }

  setLeftChartToMonth(): void {
    for(let i =0; i<=30;i++){
      this.leftChartHumidityData.push(Math.floor(Math.random() * 31));
      this.leftChartTemperatureData.push(Math.floor(Math.random() * 31))
    }

    this.leftChartLabels = this.monthLabels;
    this.leftChartDatasets = [
      { data: this.leftChartHumidityData, label: "Humidity" },
      { data: this.leftChartTemperatureData, label: "Temperature" },
    ];
  }

  setLeftChartToYear(): void {
    let oneMonthAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth());
    let twoMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 1);
    let threeMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 2);
    let fourMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 3);
    let fiveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 4);
    let sixMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 5);
    let sevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 6);
    let eightMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 7);
    let nineMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 8);
    let tenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 9);
    let elevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 10);
    let twelveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 11);

    let monthIndexes = [
      oneMonthAgoIndex,
      twoMonthsAgoIndex,
      threeMonthsAgoIndex,
      fourMonthsAgoIndex,
      fiveMonthsAgoIndex,
      sixMonthsAgoIndex,
      sevenMonthsAgoIndex,
      eightMonthsAgoIndex,
      nineMonthsAgoIndex,
      tenMonthsAgoIndex,
      elevenMonthsAgoIndex,
      twelveMonthsAgoIndex,
    ].reverse();

    this.leftChartLabels = monthIndexes.map((monthIndex) =>
      this.utilsService.getMonthNameFromIndex(monthIndex)
    );
    for(let i =0; i<=23;i++){
      this.leftChartHumidityData.push(Math.floor(Math.random() * 24));
      this.leftChartTemperatureData.push(Math.floor(Math.random() * 24))
    }
    

    this.leftChartDatasets = [
      { data: this.leftChartHumidityData, label: "Humidity" },
      { data: this.leftChartTemperatureData, label: "Temperature" },
    ];
  }

  emptyLeftChartValues() {
    this.leftChartHumidityData = [];
    this.leftChartTemperatureData = [];
  }


  handleLeftChartStatics() {
    this.leftChartType = "line";
    this.leftChartColors = [
      {
        backgroundColor: "rgba(198,250,255, 0.7)",
        borderColor: "rgba(135,206,235, .7)",
        borderWidth: 2,
      },
      {
        backgroundColor: "rgba(255,69,0, 0.7)",
        borderColor: "rgb(218,165,32, .7)",
        borderWidth: 2,
      },
    ];
    this.leftChartOptions = {
      responsive: true,
    };

    this.leftChartLabels = Array.from({ length: 24 }, (x, i) => i).map(n => (n == 23) || (n == 12) ? n.toString() + "h ago" : "").reverse();
    this.leftChartDatasets = [
      { data: this.leftChartHumidityData, label: "Humidity" },
      { data: this.leftChartTemperatureData, label: "Temperature" },
    ];
  }

  emptyRightChartValues() {
    this.rightChartMetaneData = [];
    this.rightChartCarbonMonoxideData = [];
    this.rightChartSmokeData = [];
  }

  handleRightChartStatics() {
    this.rightChartType = "line";
    this.rightChartColors = [
      {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderColor: "rgba(176, 224, 230, .7)",
        borderWidth: 2,
      },
      {
        backgroundColor: "rgba(211, 211, 211, 0.7)",
        borderColor: "rgba(112, 128, 144, .7)",
        borderWidth: 2,
      },
      {
        backgroundColor: "rgba(0, 100, 100, 0.7)",
        borderColor: "rgba(0, 128, 128, .7)",
        borderWidth: 2,
      },
    ];
    this.rightChartOptions = {
      responsive: true,
    };
    this.rightChartLabels = this.dayLabels;
    this.rightChartDatasets = [
      { data: this.rightChartCarbonMonoxideData, label: "Carbon Monoxide" },
      { data: this.rightChartSmokeData, label: "Smoke" },
      { data: this.rightChartMetaneData, label: "Metane" },
    ];
  }

  emptyBarChartValues() {
    this.barChartPressureData = [];
  }

  setBarChartPeriod(value: string) {
    this.emptyBarChartValues();
    switch (value) {
      case "1y":
        this.setBarChartToYear();
        break;
      case "1m":
        this.setBarChartToMonth();
        break;
      case "7d":
        this.setBarChartToWeek();
        break;
      case "1d":
        this.setBarChartToDay();
        break;
    }
  }

  setBarChartToYear() {
    //this.barChartPressureData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for(let i =0; i<=11;i++){
      this.barChartPressureData.push(Math.floor(Math.random() * 12));
    }
    let oneMonthAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth());
    let twoMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 1);
    let threeMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 2);
    let fourMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 3);
    let fiveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 4);
    let sixMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 5);
    let sevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 6);
    let eightMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 7);
    let nineMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 8);
    let tenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 9);
    let elevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 10);
    let twelveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 11);

    let monthIndexes = [
      oneMonthAgoIndex,
      twoMonthsAgoIndex,
      threeMonthsAgoIndex,
      fourMonthsAgoIndex,
      fiveMonthsAgoIndex,
      sixMonthsAgoIndex,
      sevenMonthsAgoIndex,
      eightMonthsAgoIndex,
      nineMonthsAgoIndex,
      tenMonthsAgoIndex,
      elevenMonthsAgoIndex,
      twelveMonthsAgoIndex,
    ].reverse();

    this.barChartLabels = monthIndexes.map((monthIndex) =>
      this.utilsService.getMonthNameFromIndex(monthIndex)
    );
    this.barChartDatasets = [
      {
        data: this.barChartPressureData,
        label: "Pressure",
      }
    ];
  }

  setBarChartToMonth() {
   // this.barChartPressureData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    for(let i =0; i<=30;i++){
      this.barChartPressureData.push(Math.floor(Math.random() * 31));
    }
    this.barChartLabels = this.monthLabels;
    this.barChartDatasets = [
      {
        data: this.barChartPressureData,
        label: "Pressure",
      }
    ];
  }

  setBarChartToWeek() {
    //this.barChartPressureData = [0, 1, 2, 3, 4, 5, 6];
    for(let i =0; i<=6;i++){
      this.barChartPressureData.push(Math.floor(Math.random() * 6));
    }
    let lastDayIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay()
    );
    let lastTwoDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 48 * 60 * 60 * 1000).getDay()
    );
    let lastThreeDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 72 * 60 * 60 * 1000).getDay()
    );
    let lastFourDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 96 * 60 * 60 * 1000).getDay()
    );
    let lastFiveDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 120 * 60 * 60 * 1000).getDay()
    );
    let lastSixDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 144 * 60 * 60 * 1000).getDay()
    );
    let lastSevenDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 168 * 60 * 60 * 1000).getDay()
    );

    let dayIndexes = [
      lastSevenDaysIndex,
      lastSixDaysIndex,
      lastFiveDaysIndex,
      lastFourDaysIndex,
      lastThreeDaysIndex,
      lastTwoDaysIndex,
      lastDayIndex,
    ];

    this.barChartLabels = dayIndexes.map((dayIndex) =>
      this.getDayNameFromIndex(dayIndex)
    );
    this.barChartDatasets = [
      {
        data: this.barChartPressureData,
        label: "Pressure",
      }
    ];
  }

  setBarChartToDay() {
    //this.barChartPressureData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    for(let i =0; i<=23;i++){
      this.barChartPressureData.push(Math.floor(Math.random() * 24));
    }
    this.barChartLabels = this.dayLabels;
    this.barChartDatasets = [
      {
        data: this.barChartPressureData,
        label: "Pressure",
      }
    ];
  }

  setRightChartPeriod(value: string) {
    this.emptyRightChartValues();

    switch (value) {
      case "1y":
        this.setRightChartToYear();
        break;
      case "1m":
        this.setRightChartToMonth();
        break;
      case "7d":
        this.setRightChartToWeek();
        break;
      case "1d":
        this.setRightChartToDay();
        break;
    }
  }

  setRightChartToDay(): void {


    //this.rightChartCarbonMonoxideData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
   // this.rightChartSmokeData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
   // this.rightChartMetaneData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    for(let i =0; i<=23;i++){
      this.rightChartMetaneData.push(Math.floor(Math.random() * 24));
      this.rightChartSmokeData.push(Math.floor(Math.random() * 24));
      this.rightChartCarbonMonoxideData.push(Math.floor(Math.random() * 24));

    }
    this.rightChartLabels = this.dayLabels;
    this.rightChartDatasets = [
      { data: this.rightChartCarbonMonoxideData, label: "Carbon monoxide" },
      { data: this.rightChartSmokeData, label: "Smoke" },
      { data: this.rightChartMetaneData, label: "Gas" },
    ];

  }

  setRightChartToWeek(): void {
   // this.rightChartCarbonMonoxideData = [0, 1, 2, 3, 4, 5, 6, 7];
   // this.rightChartSmokeData = [0, 1, 2, 3, 4, 5, 6, 7];
    //this.rightChartMetaneData = [0, 1, 2, 3, 4, 5, 6, 7];

    for(let i =0; i<=7;i++){
      this.rightChartMetaneData.push(Math.floor(Math.random() * 7));
      this.rightChartSmokeData.push(Math.floor(Math.random() * 7));
      this.rightChartCarbonMonoxideData.push(Math.floor(Math.random() * 7));

    }
    let lastDayIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000).getDay()
    );
    let lastTwoDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 48 * 60 * 60 * 1000).getDay()
    );
    let lastThreeDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 72 * 60 * 60 * 1000).getDay()
    );
    let lastFourDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 96 * 60 * 60 * 1000).getDay()
    );
    let lastFiveDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 120 * 60 * 60 * 1000).getDay()
    );
    let lastSixDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 144 * 60 * 60 * 1000).getDay()
    );
    let lastSevenDaysIndex = this.utilsService.getEuropeanDayIndex(
      new Date(new Date().getTime() - 168 * 60 * 60 * 1000).getDay()
    );

    let dayIndexes = [
      lastSevenDaysIndex,
      lastSixDaysIndex,
      lastFiveDaysIndex,
      lastFourDaysIndex,
      lastThreeDaysIndex,
      lastTwoDaysIndex,
      lastDayIndex,
    ];

    this.rightChartLabels = dayIndexes.map((dayIndex) =>
      this.getDayNameFromIndex(dayIndex)
    );
    this.rightChartDatasets = [
      { data: this.rightChartCarbonMonoxideData, label: "Carbon Monoxide" },
      { data: this.rightChartSmokeData, label: "Smoke" },
      { data: this.rightChartMetaneData, label: "Gas" },
    ];
  }

  setRightChartToMonth(): void {
    //this.rightChartCarbonMonoxideData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
   // this.rightChartSmokeData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    //this.rightChartMetaneData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    for(let i =0; i<=30;i++){
      this.rightChartMetaneData.push(Math.floor(Math.random() * 31));
      this.rightChartSmokeData.push(Math.floor(Math.random() * 31));
      this.rightChartCarbonMonoxideData.push(Math.floor(Math.random() * 31));

    }

    this.rightChartLabels = this.monthLabels;
    this.rightChartDatasets = [
      { data: this.rightChartCarbonMonoxideData, label: "Carbon monoxide" },
      { data: this.rightChartSmokeData, label: "Smoke" },
      { data: this.rightChartMetaneData, label: "Gas" },
    ];
  }

  setRightChartToYear(): void {
   // this.rightChartCarbonMonoxideData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
   // this.rightChartSmokeData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
   // this.rightChartMetaneData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
   for(let i =0; i<=11;i++){
    this.rightChartMetaneData.push(Math.floor(Math.random() * 12));
    this.rightChartSmokeData.push(Math.floor(Math.random() * 12));
    this.rightChartCarbonMonoxideData.push(Math.floor(Math.random() * 12));

  }
    let oneMonthAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth());
    let twoMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 1);
    let threeMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 2);
    let fourMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 3);
    let fiveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 4);
    let sixMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 5);
    let sevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 6);
    let eightMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 7);
    let nineMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 8);
    let tenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 9);
    let elevenMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 10);
    let twelveMonthsAgoIndex = this.utilsService.getMonthIndex(new Date().getMonth() - 11);

    let monthIndexes = [
      oneMonthAgoIndex,
      twoMonthsAgoIndex,
      threeMonthsAgoIndex,
      fourMonthsAgoIndex,
      fiveMonthsAgoIndex,
      sixMonthsAgoIndex,
      sevenMonthsAgoIndex,
      eightMonthsAgoIndex,
      nineMonthsAgoIndex,
      tenMonthsAgoIndex,
      elevenMonthsAgoIndex,
      twelveMonthsAgoIndex,
    ].reverse();

    this.rightChartLabels = monthIndexes.map((monthIndex) =>
      this.utilsService.getMonthNameFromIndex(monthIndex)
    );
    this.rightChartDatasets = [
      { data: this.rightChartCarbonMonoxideData, label: "Carbon monoxide" },
      { data: this.rightChartSmokeData, label: "Smoke" },
      { data: this.rightChartMetaneData, label: "Gas" },
    ];
  }
  public chartClicked(e: any): void { }
  public chartHovered(e: any): void { }



  handleBarChartStatics() {
    this.barChartType = "bar";
    this.barChartColors = [
      {
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
        ],
        borderColor: [
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 2,
      }
    ];

    this.barChartOptions = {
      responsive: true,
      scales: {
        xAxes: [
          {
            stacked: true,
          },
        ],
        yAxes: [
          {
            stacked: true,
          },
        ],
      },
    };
  }

  changeBarChartDevice(device: DeviceModel) {
    this.barSenseDevice = device;
    this.setBarChartPeriod("1d");
    this.defaultBarDeviceUsername = this.barSenseDevice.username;
  }
  changeLeftChartDevice(device: DeviceModel) {

    this.leftSenseDevice = device;
    this.setLeftChartPeriod("1d")
    this.defaultLeftDeviceUsername = this.leftSenseDevice.username;
  }

  changeRightChartDevice(device: DeviceModel) {
    this.rightSenseDevice = device;
    this.setRightChartPeriod("1d")
    this.defaultRightDeviceUsername = this.rightSenseDevice.username;
  }


  staticChartsView() {
    this.leftSenseDevice = this.defaultSenseDevice;
    this.rightSenseDevice = this.defaultSenseDevice;
    this.barSenseDevice = this.defaultSenseDevice;
    this.defaultLeftDeviceUsername = this.defaultSenseDevice.username;
    this.defaultRightDeviceUsername = this.defaultSenseDevice.username;
    this.defaultBarDeviceUsername = this.defaultSenseDevice.username;
    this.setLeftChartPeriod("1d");
    this.setRightChartPeriod("1d");
    this.setBarChartPeriod("1d");
  }

}
