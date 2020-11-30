import React, { useEffect, useContext } from "react";
import { useDropzone } from "react-dropzone";
import excelToJson from "convert-excel-to-json";
import { encode } from "base64-arraybuffer";

import styles from "./styles.scss";

import { AppContext } from "../appContext/AppContext.jsx";
import { constructDateOutOfXls } from "../../utils";

const UploadStatement = () => {
  const { setJsonData } = useContext(AppContext);
  const { getRootProps, getInputProps } = useDropzone({
    accept: ".xls",
    multiple: false,
    onDrop: handleFileDropped,
  });

  function handleFileDropped([statementFile]) {
    const reader = new FileReader();
    reader.onload = ({ target: { result } }) => {
      const { Sheet1: data } = excelToJson({
        source: encode(result),
      });
      const isCredit = data.some(({ E }) => E === "Type of Credit Card");
      const jsonData = isCredit
        ? constructCreditJsonScheme(data)
        : constructDebitJsonScheme(data);
      setJsonData(jsonData);
    };
    reader.readAsArrayBuffer(statementFile);
  }

  function constructDebitJsonScheme(data) {
    return data
      .map(({ C: date, J: description, S: amount }) => {
        return {
          date: date && constructDateOutOfXls(date),
          description,
          amount: amount && Number(amount.replace(",", "")),
        };
      })
      .filter(({ date, description, amount }) => date && description && amount);
  }

  function constructCreditJsonScheme(data) {
    const { L: statementDate } = data.find(({ E }) => E === "Statement Date");
    const [, year] = statementDate.split("-");
    return data
      .map(({ E: date, P: description, AG: amount }) => {
        return {
          date: date && `${date}/20${year}`,
          description,
          amount: amount && Number(amount.replace(",", "")),
        };
      })
      .filter(({ date, description, amount }) => date && description && amount);
  }

  useEffect(
    () => () => {
      setJsonData([]);
    },
    []
  );

  return (
    <div {...getRootProps({ className: styles.dropZone })}>
      <input multiple={false} {...getInputProps()} />
      <p>Drag and drop statement file here, or click to select the file</p>
    </div>
  );
};

export default UploadStatement;
