# Neon-JS

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Build Status](https://travis-ci.com/samcoydev/neon-js.svg?branch=master)
![Work In Progress](https://img.shields.io/badge/work-in%20progress-orange)

> 🚧 **This project is still under development, and is not ready for production use.** 🚧

> Custom-built SPA Web Component Framework

## Table of Contents

- [About the Project](#about-the-project)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Usage](#usage)
- [Run tests](#run-tests)
- [Contributing](#contributing)
- [Author](#author)
- [Show Your Support](#show-your-support)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About the Project

**Neon-JS is a custom-built Single Page Application (SPA) Web Component Framework
developed in Vanilla JavaScript**! *( because the world needed another one* 🙂 *)*. 
It provides a robust and efficient a framework that takes
advantage of the benefits of Web Components, while also providing a simple and
intuitive API for developers which allows them to build applications as close to
basic HTML and CSS as possible, while being as fun and easy to use as possible.

Neon-JS leverages modern JavaScript features and methodologies, including ES6+ syntax,
the Component-based architecture, and a Dependency Injection approach to bridging data
between Components. It also uses [Parcel](https://parceljs.org/) as a bundler, which
allows for a zero-configuration setup and a simple and intuitive development experience.

It includes a powerful **Custom Templating Engine** that supports conditional rendering 
and bidirectional data binding, enhancing the dynamism of the web components. It also 
includes a minimal **CLI Tool** for generating new components and services to jumpstart
development. The framework also includes a **Custom Router** solution for managing 
application state and navigation, and a diffing algorithm for efficient DOM updates. 
This makes Neon-JS a comprehensive solution for building performant and user-friendly SPAs.

## Getting Started

### Prerequisites

Before you can use Neon-JS, you will need to have `Node.js` and `npm` installed on your
machine. If you don't have them installed, you can download them from 
[here](https://nodejs.org/en/download/).

### Installation

1. Install the Neon CLI globally on your machine:
    
    ```bash
    npm install -g neon-cli
    ```
   
2. Verify the installation by checking the version:
    
    ```bash
    neon --version
    ```

## Usage

To create a new Neon-JS application, use the `create-app`
command followed by the name of your application:

```bash
neon create-app my-app
```

This will create a new directory called `my-app` in the current 
directory with a basic `Neon-JS` application structure.

Navigate into your new application's directory:

```bash
cd my-app
```

Now, you can start building your Neon-JS application!

## Run tests

To run tests, use the `npm run test` command:

```bash
npm run test
```

## Contributing
Contributions are what make the open-source community such an amazing 
place to learn, inspire, and create. Any contributions you make are 
greatly appreciated!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request ⭐️

## Author

👤 **Samuel Coy**

* Website: [samcodesthings.com](http://samcodesthings.com)
* Github: [@samcoydev](https://github.com/samcoydev)

## Show Your Support

Give a ⭐️ if this project helped you!

## License

Distributed under the MIT License. See LICENSE for more information.

## Acknowledgments

* Heavily inspired by [React.js](https://reactjs.org/) and [Angular](https://angular.io/)
