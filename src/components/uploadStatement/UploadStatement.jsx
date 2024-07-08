import React, { useEffect, useContext } from "react";
import { useDropzone } from "react-dropzone";
import excelToJson from "convert-excel-to-json";
import { encode } from "base64-arraybuffer";

import styles from "./styles.scss";

import { AppContext } from "../appContext/AppContext.jsx";
import UpdateHistory from "../updateHistory/UpdateHistory.jsx";

import { constructDateOutOfXls } from "../../utils";

const UploadStatement = () => {
  const { setMonthData } = useContext(AppContext);
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
      const [accountKey, jsonData] = isCredit
        ? constructCreditJsonScheme(data)
        : constructDebitJsonScheme(data);
      setMonthData({
        type: isCredit ? "credit" : "debit",
        accountKey,
        jsonData,
      });
    };
    reader.readAsArrayBuffer(statementFile);
  }

  function constructDebitJsonScheme(data) {
    const { U: accountNumber } = data.find(({ O }) => O === "Account Number");
    const filteredData = data
      .map(({ C: date, J: description, S: amount }) => {
        return {
          date: date && constructDateOutOfXls(date),
          description,
          amount: amount && Number(amount.replace(",", "")),
        };
      })
      .filter(({ date, description, amount }) => date && description && amount);

    return [accountNumber, filteredData];
  }

  function constructCreditJsonScheme(data) {
    const { L: statementDate } = data.find(({ E }) => E === "Statement Date");
    const { L: rawCardNumber } = data.find(({ E }) => E === "Card Number");
    const cardNumber = `${rawCardNumber.slice(
      0,
      4
    )} **** **** ${rawCardNumber.slice(-4)}`;
    const [, year] = statementDate.split("-");

    // Function to check if a transaction is likely an installment based on description keywords
    /**
     *
     * @param {string} description
     * @returns
     */
    const isInstallmentRelated = (description) => {
      const installmentKeywords = ["INSTALLMENT", "EPP", "INSTALL", "PAYMENT"];
      return (
        installmentKeywords.some((keyword) =>
          description.toUpperCase().includes(keyword)
        ) || description.endsWith("7E")
      );
    };

    const filteredData = data
      .map(({ E: transactionDate, P: description, AH: amountString }) => {
        if (transactionDate && description && amountString) {
          const amount = parseFloat(amountString);

          // Check if the transaction is related to installments
          if (!isInstallmentRelated(description)) {
            return {
              date: `${transactionDate.replace("-", "/")}/20${year}`,
              description,
              amount,
            };
          }
        }
      })
      .filter(
        ({ date, description, amount } = {}) => date && description && amount
      );

    return [cardNumber, filteredData];
  }

  useEffect(
    () => () => {
      setMonthData({ type: "", accountKey: "", jsonData: [] });
    },
    []
  );

  return (
    <div className={styles.uploadContainer}>
      <div {...getRootProps({ className: styles.dropZone })}>
        <input multiple={false} {...getInputProps()} />
        <p>Drag and drop statement file here, or click to select the file</p>
      </div>
      <UpdateHistory />
    </div>
  );
};

export default UploadStatement;
