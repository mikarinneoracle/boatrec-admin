FROM fra.ocir.io/oracsmnorthuk/boatrec-adw-base:1.0

EXPOSE 3000
WORKDIR ./
ADD . ./

CMD TNS_ADMIN=/usr/lib/oracle/18.3/client64/lib/wallets; export TNS_ADMIN && \
    npm install && \
    node server.js
