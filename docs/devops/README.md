# DevOps Roadmap

## Overview

This document presents the proposed DevOps roadmap for the
ft_transcendence project.

The objective is to provide a reproducible, secure, and observable
deployment that can be started with a single command.

## Current Architecture

The application currently consists of:

- Node.js and Express
- EJS
- Socket.IO
- MongoDB with Mongoose
- Session-based authentication
- An AI component under development

## Proposed Architecture

```text
Browser
   |
   | HTTPS
   v
Nginx
   |
   v
Express / EJS / Socket.IO
   |
   v
MongoDB
```

## Containerization

## HTTPS and Security

## Health Checks

## Monitoring

## Log Management

## Backup and Recovery