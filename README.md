# DongneLibrary Web API

도서관 책을 빌릴 수 있는지 알려주는 Web API 서비스, [블로그](https://agvim.wordpress.com/2017/09/20/web-api-check-if-a-library-book-was-rented/)에서 간단하게 정리했다.

## Install

    git clone https://github.com/afrontend/dlserver.git
    cd dlserver
    npm install

## Run

    npm start

## 로컬 서버에서 확인

- [도서관 목록 읽기](https://localhost:3000/)
- [도서관 목록 읽기 (JSON)](https://localhost:3000/libraryList)
- [책 검색](https://localhost:3000/javascript/판교)
- [책 검색 (JSON)](https://localhost:3000/?title=javascript&libraryName=판교)
- [웹 서비스로 사용](https://localhost:3000/app)

## 서버에서 확인

무료 서버라 10초 정도 걸릴 수 있다.

- [도서관 목록 읽기](https://dlserver.herokuapp.com/)
- [도서관 목록 읽기 (JSON)](https://dlserver.herokuapp.com/libraryList)
- [책 검색](https://dlserver.herokuapp.com/javascript/판교)
- [책 검색 (JSON)](https://dlserver.herokuapp.com/?title=javascript&libraryName=판교)
- [웹 서비스로 사용](https://dlserver.herokuapp.com/app)



