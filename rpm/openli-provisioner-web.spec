Name:           openli-provisioner-web
Version:        1.0.0
Release:        1%{?dist}
Summary:        Web Interface for the OpenLI provisioner

License:        GPLv3
URL:            https://github.com/OpenLI-NZ/openli-provisioner-web
Source0:        https://github.com/OpenLI-NZ/openli-provisioner-web/archive/%{version}.tar.gz

BuildRequires: make
Requires: bash
Requires: redis
Requires: httpd
Requires: systemd
Requires: sudo
Requires: curl
Requires: make
Requires: findutils
Requires: mod_ssl

%description
OpenLI is a software suite that allows network operators to conduct
lawful interception of Internet traffic that is compliant with the
ETSI Lawful Intercept standards.
This package contains a ReactJS Bootstrap application that provides
a simple user interface to the intercept provisioner component of
OpenLI.

%prep
%setup -q -n openli-provisioner-web-%{version}

%install
mkdir -p %{buildroot}/%{_bindir}
cp -a scripts/*-rpm.sh %{buildroot}/%{_bindir}

%post
%{_bindir}/openli-web-provisioner-install-rpm.sh

if [ $1 == 1 ]; then
    %{_bindir}/openli-web-provisioner-postinst-rpm.sh
fi

%preun
if [ $1 == 0 ] ; then
    %{_bindir}/openli-web-provisioner-uninstall-rpm.sh
fi

%postun
if [ $1 == 1 ]; then
    %{_bindir}/openli-web-provisioner-postupgrade-rpm.sh
fi

%files
%{_bindir}/openli-web-provisioner-install-rpm.sh
%{_bindir}/openli-web-provisioner-postinst-rpm.sh
%{_bindir}/openli-web-provisioner-uninstall-rpm.sh
%{_bindir}/openli-web-provisioner-postupgrade-rpm.sh

%changelog
* Tue Apr 11 2023 Shane Alcock <shane@alcock.co.nz> - 1.0.0-1
- First RPM release

