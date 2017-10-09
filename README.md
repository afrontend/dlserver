도서관 책을 빌릴 수 있는지 알려주는 Web API 서버

https://agvim.wordpress.com/2017/09/20/web-api-check-if-a-library-book-was-rented/

## Installation

    git clone https://github.com/afrontend/dlserver.git
    cd dlserver
    npm install

## Usage

    npm start

## 도서관 목록 읽기

* http://localhost:3000/
* http://localhost:3000/libraryList

## 책 검색

* http://localhost:3000/javascript/판교
* http://localhost:3000/?title=javascript&libraryName=판교

## 서버에서 확인

무료 서버에서 동작함으로 잠들어 있다면 깨어나는데 10초 정도 걸릴수 있어요.

* https://dlserver.herokuapp.com/
* https://dlserver.herokuapp.com/libraryList
* https://dlserver.herokuapp.com/javascript/판교
* https://dlserver.herokuapp.com/?title=javascript&libraryName=판교
