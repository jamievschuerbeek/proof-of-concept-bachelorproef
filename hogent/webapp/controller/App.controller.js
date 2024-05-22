sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, MessageToast) {
    "use strict";

    const url = "http://127.0.0.1:5000";

    return Controller.extend("hogent.controller.App", {
      onInit: function () {
        this.openAuthDialog();
      },

      //Handle file upload to API
      handleUploadPress: function () {
        var pModel = this.getView().byId("selectModel").getSelectedItem();
        if (pModel === null) {
          MessageToast.show("No model selected");
          return;
        }

        fetch(url + "/inference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: pModel.getKey(),
            auth: this.getView().getModel("auth").getData(),
            text: this.getView().getModel("currentText").getData().text,
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            console.log(data);
            this.getView().setModel(new JSONModel(data), "result");
          });
      },

      //Hadle file change - read file content and store locally
      onFileChange: function (e) {
        var file = e.getParameter("files") && e.getParameter("files")[0];
        if (file && window.FileReader) {
          var reader = new FileReader();
          reader.onload = function (evn) {
            var strCSV = evn.target.result;
            console.log(strCSV);
            this.getView().setModel(
              new JSONModel({ text: strCSV }),
              "currentText"
            );
          }.bind(this);
          reader.readAsText(file);
        }
      },

      //Handle file change - change file on api
      onAuthFileChanged: function (e) {
        var file = e.getParameter("files") && e.getParameter("files")[0];
        if (file && window.FileReader) {
          var reader = new FileReader();
          reader.onload = function (evn) {
            var strCSV = evn.target.result;
            this.getView().setModel(new JSONModel(JSON.parse(strCSV)), "auth");

            this.byId("dlgUploadAuth").close();
          }.bind(this);
          reader.readAsText(file);
        }
      },

      //make sure dialog is destroyed
      onAuthClose: function () {
        this.byId("dlgUploadAuth").destroy();
        this.pDialog = null;

        this.addUserInfo();
        this.fetchModels();

        console.log(this.getView().getModel("auth").getData());
      },

      //Open auth dialog
      openAuthDialog: function () {
        if (this.byId("dlgUploadAuth")) {
          this.byId("dlgLogin").destroy();
          this.pDialog = null;
        }
        this.pDialog = this.loadFragment({
          name: "hogent.fragment.UploadAuth",
        });
        this.pDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      //get all available models
      fetchModels: function () {
        console.log("fetching models");
        console.log(this.getView().getModel("auth").getData());

        fetch(url + "/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.getView().getModel("auth").getData()),
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            console.log(data);
            this.getView().setModel(new JSONModel(data), "models");
          });
      },

      //check if connection to API is OK
      addUserInfo: function () {
        var pUrl = url + "/health";

        fetch(pUrl, {
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            this.getView()
              .byId("lblApiHealth")
              .setText(data)
              .setColorScheme(data === "OK" ? 8 : 2);
          });
      },
    });
  }
);
