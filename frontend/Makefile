STYLES := bootstrap font-awesome page
LIBS := jquery underscore backbone
MODELS := ReferenceCountedModel Song SongList DownloadBasket
VIEWS := SongRow SongTable DownloadSelector
CONTROLS := AudioPlayer
APPS := app

JS_DIR := js
CSS_DIR := css
LIB_DIR := $(JS_DIR)/lib
MODEL_DIR := $(JS_DIR)/models
VIEW_DIR := $(JS_DIR)/views
CONTROL_DIR := $(JS_DIR)/controls

DEBUG ?= 0

JS_MIN_OUTPUT := $(JS_DIR)/scripts.min.js
CSS_MIN_OUTPUT := $(CSS_DIR)/styles.min.css



LIBS_JS := $(patsubst %, $(LIB_DIR)/%.js, $(LIBS))
MODELS_JS := $(patsubst %, $(MODEL_DIR)/%.js, $(MODELS))  
VIEWS_JS := $(patsubst %, $(VIEW_DIR)/%.js, $(VIEWS))
CONTROLS_JS := $(patsubst %, $(CONTROL_DIR)/%.js, $(CONTROLS))
APPS_JS := $(patsubst %, $(JS_DIR)/%.js, $(APPS))
JS_INPUT := $(LIBS_JS) $(MODELS_JS) $(VIEWS_JS) $(CONTROLS_JS) $(APPS_JS)
CSS_INPUT := $(patsubst %, $(CSS_DIR)/%.css, $(STYLES))
JS_MIN_INPUT := $(patsubst %.js, %.min.js, $(filter-out %.min.js, $(JS_INPUT)))
CSS_MIN_INPUT := $(patsubst %.css, %.min.css, $(filter-out %.min.css, $(CSS_INPUT)))

JS_COMPILER := java -jar bin/closure-compiler.jar --warning_level QUIET
CSS_COMPILER := java -jar bin/yui-compressor.jar --type css

.PHONY: all clean

all: $(JS_MIN_OUTPUT) $(CSS_MIN_OUTPUT)

ifeq ($(DEBUG),0)
%.min.js: %.js
	@echo "    JS     " $@
	@$(JS_COMPILER) --js $< --js_output_file $@
else
%.min.js: %.js
	@echo "    JS     " $@
	@cat $< > $@
endif

%.min.css: %.css
	@echo "    CSS    " $@
	@$(CSS_COMPILER) -o $@ $<

$(JS_MIN_OUTPUT): $(JS_MIN_INPUT)
	@echo "    CAT    " $@
	@cat $^ > $@

$(CSS_MIN_OUTPUT): $(CSS_MIN_INPUT)
	@echo "    CAT    " $@
	@cat $^ > $@

clean:
	@echo "    RM     " $(JS_MIN_INPUT) $(JS_MIN_OUTPUT) $(CSS_MIN_INPUT) $(CSS_MIN_OUTPUT)
	@rm -fv $(JS_MIN_INPUT) $(JS_MIN_OUTPUT) $(CSS_MIN_INPUT) $(CSS_MIN_OUTPUT)
