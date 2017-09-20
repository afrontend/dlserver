동네 도서관 책 대출 여부를 알려주는 Web API 서버

### Install

    git clone https://github.com/afrontend/dlserver.git
    cd dlserver
    npm install


### Run

    npm start

### 도서관 목록 읽기

* HTML: http://localhost:3000/
* JSON: http://localhost:3000/libraryList

### 책 검색

* HTML: http://localhost:3000/javascript/판교
* JSON: http://localhost:3000/?title=javascript&libraryName=판교

### 허로쿠 무료 서버에서 기능을 확인할 수 있다.

* https://dlserver.herokuapp.com/
* https://dlserver.herokuapp.com/libraryList
* https://dlserver.herokuapp.com/javascript/판교
* https://dlserver.herokuapp.com/?title=javascript&libraryName=판교


