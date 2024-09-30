// src/Components/HeaderStudent.jsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/vite.svg';

const HeaderStudent = () => {
  return (
    <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand href="" className="d-flex align-items-center">
          <img
            src={ logo } // Replace with the path to your logo image
            alt="Logo"
            className="d-inline-block align-top"
            height="40"
          />
          <span className="ms-2">Assessment Platform</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            <Nav.Link href="/about" className="mx-2">About</Nav.Link>
            <Nav.Link href="/contact-us" className="mx-2">Contact Us</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default HeaderStudent;
