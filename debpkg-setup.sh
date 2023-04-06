#!/bin/bash

set -x -e -o pipefail

export DEBEMAIL='shane@alcock.co.nz'
export DEBFULLNAME='Shane Alcock'
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y equivs devscripts dpkg-dev quilt curl apt-transport-https \
    apt-utils ssl-cert ca-certificates gnupg lsb-release debhelper git \
    pkg-config sed

DISTRO=$(lsb_release -sc)

case ${DISTRO} in
        bullseye )
                sed -i 's/ dh-systemd (>=1.5)//' debian/control
        ;;

        jammy )
                sed -i 's/ dh-systemd (>=1.5)//' debian/control
        ;;

        bionic )
                apt-get install -y debhelper -t bionic-backports
        ;;
esac


apt-get update
apt-get upgrade -y
