import React, { useContext, useState, useEffect } from "react";
import { Input, Table, Pagination } from "semantic-ui-react";

import { AppContext } from "../appContext/AppContext.jsx";

import styles from "./styles.scss";

const ExpensesTable = () => {
  const {
    monthData: { jsonData },
  } = useContext(AppContext);
  const [sortingDirection, setSortingDirection] = useState(null);
  const [filteredData, setFilteredData] = useState(jsonData);
  const [startEndIndexes, setStartEndIndexes] = useState([0, 10]);
  const [activePage, setActivePage] = useState(1);
  const [searchValue, setSearchValue] = useState("");

  const totalPages = Math.ceil(filteredData.length / 10);
  const getSortingDirection = sortingDirection
    ? sortingDirection === "asc"
      ? "ascending"
      : "descending"
    : null;
  const totalAmount = filteredData.reduce((total, { amount }) => {
    total += amount;
    return total;
  }, 0);

  function sort() {
    let sorted = [];
    if (!sortingDirection || sortingDirection === "asc") {
      setSortingDirection("desc");
      sorted = filteredData.sort(
        ({ amount: amountA }, { amount: amountB }) => amountB - amountA
      );
    } else {
      setSortingDirection("asc");
      sorted = filteredData.sort(
        ({ amount: amountA }, { amount: amountB }) => amountA - amountB
      );
    }
    setFilteredData(sorted);
  }

  function onPageChange(_, { activePage }) {
    const startIndex = (activePage - 1) * 10;
    const endIndex = startIndex + 10;
    setStartEndIndexes([startIndex, endIndex]);
    setActivePage(activePage);
  }

  function handleSearchChange(_, { value }) {
    resetData();
    setSearchValue(value);

    const regex = new RegExp(value, "gi");
    const results = jsonData.filter(({ description }) =>
      description.match(regex)
    );

    setFilteredData(results);
  }

  function resetData() {
    setActivePage(1);
    setStartEndIndexes([0, 10]);
  }

  useEffect(() => {
    resetData();
    setSearchValue("");
    setFilteredData(jsonData);
  }, [jsonData]);

  return (
    <>
      <Input
        placeholder="Search..."
        onChange={handleSearchChange}
        value={searchValue}
        icon="search"
      />
      <div className={styles.tableWrapper}>
        <Table sortable celled selectable striped fixed>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Table.HeaderCell sorted={getSortingDirection} onClick={sort}>
                Amount
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredData
              .slice(...startEndIndexes)
              .map(({ date, description, amount }, index) => (
                <Table.Row key={`${description}-${index}`}>
                  <Table.Cell>{date}</Table.Cell>
                  <Table.Cell>{description}</Table.Cell>
                  <Table.Cell>{amount.toLocaleString()}</Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan="2">Total Amount</Table.HeaderCell>
              <Table.HeaderCell>
                {totalAmount.toLocaleString()}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
        <Pagination
          activePage={activePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        ></Pagination>
      </div>
    </>
  );
};

export default ExpensesTable;
