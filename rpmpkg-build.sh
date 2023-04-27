#!/bin/bash

set -x -e -o pipefail

export QA_RPATHS=$[ 0x0001 ]
SOURCENAME=`echo ${GITHUB_REF##*/} | cut -d '-' -f 1`

mkdir -p build_tarball/openli-provisioner-web-${SOURCENAME}/scripts
cp scripts/*.sh build_tarball/openli-provisioner-web-${SOURCENAME}/scripts/

cd build_tarball

# not a great way to do this...
tar -czf openli-provisioner-web-${SOURCENAME}.tar.gz \
        openli-provisioner-web-${SOURCENAME}


cp ./openli-provisioner-web-*.tar.gz ~/rpmbuild/SOURCES/${SOURCENAME}.tar.gz
cp ../rpm/openli-provisioner-web.spec ~/rpmbuild/SPECS/

cd ../ && rm -rf build_tarball

cd ~/rpmbuild && rpmbuild -bb --define "debug_package %{nil}" SPECS/openli-provisioner-web.spec

