.PHONY: all clean pre_build build install install_venv uninstall

prefix ?= /usr

all: build

clean:
	rm -rf build
	rm -rf node_modules

pre_build:
	npm install

build:
	npm run build

install:
	mkdir -p "${DESTDIR}${prefix}/lib/openli-provisioner-web/openli_provisioner_web/build"
	cp -r openli_provisioner_web/* "${DESTDIR}${prefix}/lib/openli-provisioner-web/openli_provisioner_web/"
	cp -r build/* "${DESTDIR}${prefix}/lib/openli-provisioner-web/openli_provisioner_web/build/"

install_venv:
	python3 -m venv "${DESTDIR}${prefix}/lib/openli-provisioner-web/venv"
	"${DESTDIR}${prefix}/lib/openli-provisioner-web/venv/bin/pip" install --upgrade setuptools wheel pip
	"${DESTDIR}${prefix}/lib/openli-provisioner-web/venv/bin/pip" install -r requirements.txt
	"${DESTDIR}${prefix}/lib/openli-provisioner-web/venv/bin/pip" install gunicorn

uninstall:
	rm -rf "${DESTDIR}${prefix}/lib/openli-provisioner-web"
