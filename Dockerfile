FROM oraclelinux@sha256:a5532f99b064c6f4585563711419507767ccaf57d3dc5eca7310a90d31d41490

RUN mkdir -p /usr/lib/oracle/18.3/client64/lib/wallets
ADD wallets/ADW/* /usr/lib/oracle/18.3/client64/lib/wallets/
WORKDIR ./
ADD index.js ./
ADD dbconfig.js ./
ADD package.json ./

CMD echo "Hello!" && \
    yum install -y oracle-nodejs-release-el7 oracle-release-el7 && \
    yum -y install --disablerepo=ol7_developer_EPEL nodejs node-oracledb-node10 && \
    sh -c "echo /usr/lib/oracle/18.3/client64/lib > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
    ldconfig && \
    TNS_ADMIN=/usr/lib/oracle/18.3/client64/lib/wallets; export TNS_ADMIN && \
    npm install && \
    node index.js \
    echo "Goodbye !"
