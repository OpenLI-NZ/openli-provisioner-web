Name:           openli-provisioner-web
Version:        1.1.3
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
cp -a scripts/openli-web-provisioner-npm.sh %{buildroot}/%{_bindir}
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
%{_bindir}/openli-web-provisioner-npm.sh

%changelog
* Mon Mar 18 2024 Shane Alcock <salcock@searchlight.nz> - 1.1.3-1
- Fix missing files in npm package that would prevent the web service from starting.
- Use openli-provisioner-web user to run npm, rather than root.
- Upgrade from node 14 to node 16.
- Fix page error when there are multiple default RADIUS users.
- Fix some minor errors in the uninstall script for RPM packages.

* Fri Aug 18 2023 Shane Alcock <salcock@searchlight.nz> - 1.1.2-1
- Add support for email decompression config options
- Fix issue where reloading would display a blank page
- Hide links to pages where the OpenLI provisioner can not support the requests necessary to display that page's content

* Mon Jul 31 2023 Shane Alcock <shane@alcock.co.nz> - 1.1.1-1
- Add payload encryption support

* Thu Jul 06 2023 Shane Alcock <shane@alcock.co.nz> - 1.1.0-1
- Add email intercept support
- Add outputhandovers config option support
- Sort lists of intercepts, agencies, etc. by key
- Fix RPM postinst script failing to copy default config into /etc/
* Tue Apr 11 2023 Shane Alcock <shane@alcock.co.nz> - 1.0.0-1
- First RPM release

