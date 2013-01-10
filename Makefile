include server.cfg

.PHONY: all clean upload deploy update-collection

all:
	@$(MAKE) -C frontend

clean:
	@$(MAKE) -C frontend clean
	@$(MAKE) -C backend clean

upload: all
	@echo "    RSYNC   $(SERVER):$(SERVER_UPLOAD_PATH)"
	@rsync -aizm --delete-excluded --exclude=*.cfg --exclude=*.conf --filter="P app.cfg" --exclude=*.swp --exclude=.git* --exclude=frontend/bin/ \
		--exclude=Makefile --exclude=*.pyc --include=scripts.min.js --include=styles.min.css --exclude=*.js --exclude=*.css \
		. "$(SERVER):$(SERVER_UPLOAD_PATH)"

deploy: upload
	@echo "    DEPLOY  $(SERVER):$(SERVER_DEPLOY_PATH)"
	@ssh -t "$(SERVER)" "set -ex; \
		umask 027; \
		sudo rsync -rim --delete --filter='P zmusic.db' '$(SERVER_UPLOAD_PATH)/' '$(SERVER_DEPLOY_PATH)'; \
		sudo chown -R uwsgi:nginx '$(SERVER_DEPLOY_PATH)'; \
		sudo find '$(SERVER_DEPLOY_PATH)' -type f -exec chmod 640 {} \;; \
		sudo find '$(SERVER_DEPLOY_PATH)' -type d -exec chmod 750 {} \;; \
		sudo /etc/init.d/uwsgi.zmusic restart"

update-collection:
	@echo "    RSYNC   $(SERVER):$(SERVER_COLLECTION_PATH)"
	@rsync -avzPi --delete-excluded --delete-after --fuzzy --exclude=.directory '$(LOCAL_COLLECTION_PATH)/' '$(SERVER):$(SERVER_COLLECTION_PATH)'
	@echo "    SCAN    $(SERVER)"
	@curl 'http://$(SERVER)/scan?username=$(ADMIN_USERNAME)&password=$(ADMIN_PASSWORD)'
