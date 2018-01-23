import {Component, Input, OnInit} from '@angular/core';
import {config, defaultI18n, defaultOptions} from "./formbuilder/config";
import {FormBuilderCreateor} from "./formbuilder/form-builder";
import I18N from "./formbuilder/mi18n";
import {FormControl, FormGroup, Validators, FormArray} from "@angular/forms";

function initJq() {
  (function ($) {
    (<any>$.fn).formBuilder = function (options) {
      if (!options) {
        options = {};
      }
      let elems = this;
      let {i18n, ...opts} = $.extend({}, defaultOptions, options, true);
      (<any>config).opts = opts;
      let i18nOpts = $.extend({}, defaultI18n, i18n, true);
      let instance = {
        actions: {
          getData: null,
          setData: null,
          save: null,
          showData: null,
          setLang: null,
          addField: null,
          removeField: null,
          clearFields: null
        },
        get formData() {
          return instance.actions.getData('json');
        },

        promise: new Promise(function (resolve, reject) {
          new I18N().init(i18nOpts).then(() => {
            elems.each(i => {
              let formBuilder = new FormBuilderCreateor().getFormBuilder(opts, elems[i]);
              $(elems[i]).data('formBuilder', formBuilder);
              instance.actions = formBuilder.actions;
            });
            delete instance.promise;
            resolve(instance);
          }).catch(console.error);
        })

      };

      return instance;
    };
  })(jQuery);
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  formBuilder: any;
  options: any;
  form: FormGroup;
  showForm = false;
  dynamicData = [];

  ngOnInit(): void {
    this.options = {
      dataType: 'json',
      controlOrder: [
        'text',
        'select'
      ],
      disabledAttrs: [
        'access',
        'style',
        'className',
        'description',
        'multiple',
        'placeholder',
        'inline',
        'toggle',
        'other',
        'subtype',
        'maxlength'
      ],
       showActionButtons: false,
      disableFields: [
        'autocomplete',
        'file',
        'date',
        'hidden',
        'textarea',
        'button',
        'radio-group',
        'number',
        'copy'
      ],
      typeUserEvents: {
        select: {
          onadd: function(fld) {
           (<any>jQuery(fld)).find('.field-actions a:last').hide();
          }
        }
      }
    };
    initJq();
    this.formBuilder = (<any>jQuery('.build-wrap')).formBuilder(this.options);
  }


  formOnSave() {
    if (this.formBuilder.actions) {
      //Fix For Paragraph + Header Label [Force Rendering]
      this.formBuilder.actions.save();

      this.dynamicData = this.formBuilder.actions.getData();
      this.showForm = true;
      // setup the form
      const formGroup = {};

      for (let i = 0; i < this.dynamicData.length; i++) {
        if (this.dynamicData[i]['type'] === 'select') {

          //-------------------- Select Type --------------------//
          this.dynamicData[i]['key'] = this.dynamicData[i]['name'];
          for (let j = 0; j < this.dynamicData[i]['values'].length; j++) {
            let isRequired = this.mapValidators(this.dynamicData[i]['required']);

            if (this.dynamicData[i]['values'][j]['selected']) {
              let value = this.dynamicData[i]['values'][j]['value'] || '';
              formGroup[this.dynamicData[i]['name']] = new FormControl(value, isRequired);
              break;
            }
            //----------------------- Testing -----------------------//
            //let value = this.dynamicData[i]['values'][j]['value'] || '';
            //formGroup[this.dynamicData[i]['name']] = new FormControl(value, isRequired);
            //----------------------- Testing -----------------------//
          }
        }
        else if (this.dynamicData[i]['type'] === 'checkbox-group') {
          //-------------------- Checkbox Group Type --------------------//
          this.dynamicData[i]['key'] = this.dynamicData[i]['name'];
          let checkboxGroupArr = [];
          let isRequired = this.dynamicData[i]['required'] ? this.checkboxValidator : null;
          for (let j = 0; j < this.dynamicData[i]['values'].length; j++) {
            let isChecked = this.dynamicData[i]['values'][j]['selected'] ? true : false;
            checkboxGroupArr.push(new FormControl(isChecked));
          }
          formGroup[this.dynamicData[i]['key']] = new FormArray(checkboxGroupArr, isRequired);
        }
        else if (this.dynamicData[i]['type'] === 'text') {
          //-------------------- Text Type--------------------//
          this.dynamicData[i]['key'] = this.dynamicData[i]['name'];
          let value = this.dynamicData[i]['value'] || '';
          let isRequired = this.mapValidators(this.dynamicData[i]['required']);
          formGroup[this.dynamicData[i]['key']] = new FormControl(value, isRequired);
        } else if (this.dynamicData[i]['type'] === 'paragraph') {
          //-------------------- Paragraph Type--------------------//
          let randNo = new Date().getTime();
          this.dynamicData[i]['key'] = 'paragraph-' + randNo + i;
          let value = this.dynamicData[i]['label'] || '';
          formGroup[this.dynamicData[i]['key']] = new FormControl(value);
        }
        else if (this.dynamicData[i]['type'] === 'header') {
          //-------------------- Header Type--------------------//
          let randNo = new Date().getTime();
          this.dynamicData[i]['key'] = 'header-' + randNo + i;
          let value = this.dynamicData[i]['label'] || '';
          formGroup[this.dynamicData[i]['key']] = new FormControl(value);
        }
        else {
          formGroup[this.dynamicData[i]['key']] = new FormControl(this.dynamicData[i]['value'] || '');
        }
      }
      this.form = new FormGroup(formGroup);
    }
  }

  public checkboxValidator(control) {
    let controlVal = control.value.length ? control.value[0] : control.value;
    let isValid = false;
    for (let i = 0; i < control.value.length; i++) {
      if (control.value[i]) {
        isValid = true;
      }
    }
    if (!isValid) {
      return {checkboxNotCheckedErr: true};
    } else {
      //Is Valid
      return null;
    }
  }

  private mapValidators(validators) {
    const formValidators = [];
    if (validators) {
      formValidators.push(Validators.required);
    }
    return formValidators;
  }
}
