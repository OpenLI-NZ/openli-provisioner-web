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
cp -a scripts/*.sh %{buildroot}/%{_bindir}

%post
%{_bindir}/openli-web-provisioner-install.sh
%{_bindir}/openli-web-provisioner-postinst.sh

%preun
%{_bindir}/openli-web-provisioner-uninstall.sh

%postun
rm %{_bindir}/openli-web-provisioner-*.sh

%files
%{_bindir}/openli-web-provisioner-install.sh
%{_bindir}/openli-web-provisioner-postinst.sh
%{_bindir}/openli-web-provisioner-uninstall.sh

%changelog
* Tue Apr 11 2023 Shane Alcock <shane@alcock.co.nz> - 1.0.0-1
- First RPM release

