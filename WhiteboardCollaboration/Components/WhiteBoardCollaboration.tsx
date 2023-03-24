import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  PanResponder,
  Modal,
  TextInput,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
  PanResponderGestureState,
} from 'react-native';

import {v4 as uuidv4} from 'uuid';
import {check, request, PERMISSIONS} from 'react-native-permissions';
import {captureRef} from 'react-native-view-shot';
import ImagePicker from 'react-native-image-crop-picker';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import database from '@react-native-firebase/database';
import firebase from '@react-native-firebase/app';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Svg, {
  Path,
  Text as SvgText,
  Image as SvgImage,
  Circle as SvgCircle,
  Rect as SvgRectangle,
} from 'react-native-svg';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Fontisto from 'react-native-vector-icons/Fontisto';

interface IProps {}

interface IState {
  paths: {
    type: string;
    path?: string;
    color?: string;
    stroke?: number;
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    radius?: number;
    text?: string;
    image?: string;
  }[];
  currentPath: null | string;
  color: string;
  stroke: number;
  bgcolor: string;
  erasertoggle: boolean;
  textInputs: any;
  textInput: string | null;
  textCordinate: {x: number; y: number; index?: number} | null;
  visible: boolean;
  imagecordinates: {x: number; y: number; index?: number} | null;
  circle: boolean;
  circleCordinate: {
    x: number;
    y: number;
    radius: number;
  } | null;
  box: boolean;
  boxCordinate: {
    x: number;
    y: number;
    height: number;
    width: number;
  } | null;
  fullScreen: boolean;
  scale: number;
  focalX: number;
  focalY: number;
  activetool: string;
  isImageModalVisible: boolean;
  isImagePinch: number;
  isImagePinchData: any;
  isModalOpen: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.1;

class BuilderCode extends React.Component<IProps, IState> {
  panResponder: any;
  myView: any;
  constructor(props: IProps) {
    super(props);

    this.state = {
      paths: [],
      currentPath: null,
      color: '#000000',
      stroke: 5,
      bgcolor: '#FDEE9E',
      erasertoggle: false,
      textInputs: [],
      textInput: '',
      textCordinate: null,
      visible: false,
      imagecordinates: null,
      circle: false,
      circleCordinate: null,
      box: false,
      boxCordinate: null,
      fullScreen: true,
      scale: 1,
      focalX: 0,
      focalY: 0,
      activetool: '',
      isImageModalVisible: false,
      isImagePinch: -1,
      isImagePinchData: null,
      isModalOpen: false,
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease,
    });
  }

  componentDidMount() {
    database()
      .ref('/whiteboard/whiteboard-id-1/svg')
      .on(
        'value',
        snapshot => {
          if (snapshot.val()) {
            this.setState({paths: snapshot.val()});
          }
        },
        function (error: any) {
          console.error(error);
        },
      );
  }
  debounce(func: any, wait: any) {
    let timeout: string | number | undefined;
    return function executedFunction(...args: any[]) {
      const later = () => {
        //@ts-ignore
        clearTimeout(timeout);
        func(...args);
      };
      //@ts-ignore
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  delayedDatabaseWrite = this.debounce(() => {
    database().ref('/whiteboard/whiteboard-id-1/svg').set(this.state.paths);
  }, 500);

  handlePath = (path: any) => {
    this.setState(prevState => ({
      paths: [...prevState.paths, path],
    }));
  };

  handlePanResponderGrant = (event: any, gesture: PanResponderGestureState) => {
    const {circle, box, textInput, color, stroke, currentPath, paths} =
      this.state;
    const {
      nativeEvent: {locationX, locationY},
    } = event;

    switch (true) {
      case circle:
        this.setState({
          circleCordinate: {
            x: locationX,
            y: locationY,
            radius: 1,
          },
        });
        break;
      case box:
        this.setState({
          boxCordinate: {
            x: locationX,
            y: locationY,
            height: 1,
            width: 1,
          },
        });
        break;
      case textInput !== null:
        this.setState({
          textCordinate: {
            x: locationX,
            y: locationY,
          },
        });
        break;
      default:
        const path = `M${locationX},${locationY}`;
        this.setState({
          currentPath: path,
          paths: [
            ...paths,
            {
              path,
              color,
              stroke,
              type: 'path',
            },
          ],
        });
    }
  };

  handlePanResponderMove = (event: any, gesture: any) => {
    if (event.nativeEvent.touches.length > 1 && this.state.isImagePinch >= 0) {
      console.log(
        'total width',
        event.nativeEvent.touches[0].locationX,
        event.nativeEvent.touches[1].locationX,
      );
      this.setState({
        isImagePinchData: {
          ...this.state.isImagePinchData,
          x: event.nativeEvent.touches[0].locationX,
          y: event.nativeEvent.touches[0].locationY,
          width:
            event.nativeEvent.touches[1].locationX -
            event.nativeEvent.touches[0].locationX,
          height:
            event.nativeEvent.touches[1].locationY -
            event.nativeEvent.touches[0].locationY,
        },
      });
      return;
    }
    const {dx, dy} = gesture;
    const {locationX, locationY} = event.nativeEvent;
    if (this.state.textInput !== null) {
      return;
    }

    const {circle, circleCordinate, box, boxCordinate, color, stroke} =
      this.state;
    if (circle && circleCordinate?.x) {
      const radius = Math.abs(circleCordinate.x - locationX) * 2;
      this.setState({
        circleCordinate: {
          ...circleCordinate,
          radius,
        },
      });
      return;
    }
    if (box && boxCordinate) {
      const height = locationY - boxCordinate.y;
      const width = locationX - boxCordinate.x;
      this.setState({
        boxCordinate: {
          ...boxCordinate,
          height,
          width,
        },
      });
      return;
    }
    const path = `${this.state.currentPath}L${locationX},${locationY}`;
    const newPath = {path, color, stroke, type: 'path'};
    const paths = [...this.state.paths.slice(0, -1), newPath];
    this.setState({currentPath: path, paths}, () => {
      this.delayedDatabaseWrite();
    });
  };

  handlePanResponderRelease = () => {
    if (this.state.isImagePinch >= 0) {
      this.setState({
        paths: this.state.paths.map((item, index) =>
          index === this.state.isImagePinch
            ? this.state.isImagePinchData
            : item,
        ),
      });
    }
    const {circle, circleCordinate, box, boxCordinate, color, stroke} =
      this.state;
    let newPaths: {
      color: string;
      type: string;
      x: number;
      y: number;
      radius?: number;
      stroke?: number;
      height?: number;
      width?: number;
    }[] = [];

    if (circle && circleCordinate) {
      newPaths.push({
        ...circleCordinate,
        color,
        type: 'circle',
      });
    }

    if (box && boxCordinate) {
      newPaths.push({
        ...boxCordinate,
        color,
        stroke,
        type: 'rectangle',
      });
    }

    this.setState(prevState => ({
      paths: [...prevState.paths, ...newPaths],
      circleCordinate: null,
      circle: false,
      boxCordinate: null,
      box: false,
      currentPath: null,
    }));
    this.setState({isImagePinch: -1, isImagePinchData: null});
  };

  handleUndo = () => {
    const {paths} = this.state;
    if (paths.length > 0) {
      this.setState({paths: paths.slice(0, -1)}, () => {
        this.delayedDatabaseWrite();
      });
    }
  };

  handleSaveText = () => {
    const {textCordinate, textInput, color} = this.state;
    if (textCordinate?.index !== undefined) {
      this.setState(
        (prevState: IState) => ({
          paths: prevState.paths.map((path: any, index: number) =>
            textCordinate.index === index ? {...path, text: textInput} : path,
          ),
          textInput: null,
          textCordinate: null,
          isModalOpen: false,
        }),
        this.delayedDatabaseWrite,
      );
    } else {
      this.setState(
        prevState => ({
          paths: [
            ...prevState.paths,
            {
              text: `${textInput}`,
              color: color,
              x: textCordinate?.x,
              y: textCordinate?.y,
              type: 'text',
            },
          ],
          textInput: null,
          textCordinate: null,
          isModalOpen: false,
        }),
        this.delayedDatabaseWrite,
      );
    }
  };

  updateTextCordinate = (index: number, x: number, y: number) => {
    this.setState(
      prevState => ({
        paths: prevState.paths.map((path, _index) =>
          index === _index ? {...path, x: x, y: y} : path,
        ),
        textInput: '',
        textCordinate: null,
      }),
      this.delayedDatabaseWrite,
    );
  };

  getBlob = async (uri: string) => {
    const res = await fetch(uri);
    return res.blob();
  };

  handleImagepick = () => {
    try {
      ImagePicker.openPicker({
        width: 400,
        height: 300,
        cropping: true,
      }).then(async image => {
        const localFilePath = image.path.replace('file://', '');
        console.log('Image uploaded successfully!');
        const file = await this.getBlob(localFilePath);
        const childRef = firebase
          //@ts-ignore
          .storage()
          .ref('whiteboard-id-1')
          .child(Date.now().toString());
        childRef.put(file).then((snapshot: any) => {
          console.log('uploaded', snapshot);
          childRef.getDownloadURL().then((url: any) => {
            console.log('test-------------', url);
            database()
              .ref('/whiteboard/whiteboard-id-1/svg')
              .set([
                ...this.state.paths,
                {
                  image: url,
                  color: '',
                  x: 0,
                  y: 0,
                  type: 'image',
                  height: image.height / 4,
                  width: image.width / 4,
                },
              ]);
          });
        });
      });
    } catch (e) {
      console.log(e, 'error');
    }
  };
  openAppSetting = () => {
    Linking.openSettings();
  };
  showConfirmationDialog = () => {
    Alert.alert(
      'Enable Camera/Photo Gallery Permission',
      'We need the access to your Camera/Photo Gallery to upload photos to place print order, Enable Camera/Photo Gallery Permission on your device inside Settings --> PrintSEC',
      [
        {text: 'Settings', onPress: this.openAppSetting},
        {
          text: 'Cancel',
          onPress: () => {},
        },
      ],
      {
        cancelable: false,
      },
    );
  };

  checkPhotoLibraryPermission = async () => {
    let response = await check(
      Platform.OS == 'android'
        ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        : PERMISSIONS.IOS.PHOTO_LIBRARY,
    );
    if (response == 'denied') {
      request(
        Platform.OS == 'android'
          ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
          : PERMISSIONS.IOS.PHOTO_LIBRARY,
      ).then(result => {
        if (result == 'blocked') {
          this.showConfirmationDialog();
        } else if (result == 'denied') {
          this.showConfirmationDialog();
        } else if (result == 'granted') {
          this.handleImagepick();
        }
      });
    } else if (response == 'blocked') {
      this.showConfirmationDialog();
    } else if (response == 'granted') {
      this.handleImagepick();
    }
  };

  handlePrint = async () => {
    try {
      const uri = await captureRef(this.myView, {
        format: 'png',
        quality: 0.8,
      });

      const path = `${RNFS.CachesDirectoryPath}/${uuidv4()}.png`;
      await RNFS.copyFile(uri, path);
      await Share.open({url: `file://${path}`, type: 'image/png'});
    } catch (error) {
      console.log(error);
    }
  };
  togglehighlighter = (setState: (arg: any) => void) => {
    this.setState(prevState => ({
      color: 'rgba(140,255,50,.5)',
      stroke: 15,
      activetool: 'togglehighlighter',
    }));
  };

  togglePen = () => {
    this.setState({
      color: 'black',
      stroke: 5,
      activetool: 'togglePen',
    });
  };
  showfullscreen = () => {
    this.setState({
      fullScreen: false,
    });
  };
  showTools = () => {
    this.setState({
      fullScreen: true,
    });
  };

  handleZoomIn = () => {
    const {scale} = this.state;
    const newScale = scale + ZOOM_STEP;

    if (newScale <= MAX_SCALE) {
      this.setState({scale: newScale});
    }
  };

  handleZoomOut = () => {
    const {scale} = this.state;
    const newScale = scale - ZOOM_STEP;

    if (newScale >= MIN_SCALE) {
      this.setState({scale: newScale});
    }
  };

  render() {
    return (
      <>
        <View style={styles.container} {...this.panResponder.panHandlers}>
          <View
            testID="ViewRef"
            ref={(ref: any) => {
              this.myView = ref;
            }}
            style={{flex: 4, backgroundColor: `${this.state.bgcolor}`}}>
            {!this.state.fullScreen && (
              <View style={styles.showSidebar}>
                <TouchableOpacity
                  testID="collapsebtntest"
                  onPress={this.showTools}>
                  <MaterialCommunityIcons
                    name="arrow-collapse"
                    size={30}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>
            )}
            <Svg
              transform={[
                {translateX: this.state.focalX},
                {translateY: this.state.focalY},
                {scale: this.state.scale},
                {translateX: -this.state.focalX},
                {translateY: -this.state.focalY},
              ]}
              style={StyleSheet.absoluteFill}>
              {this.state.paths.map((path: any, index: number) => {
                if (path.type === 'path') {
                  return (
                    <Path
                      key={index}
                      d={path.path}
                      stroke={path.color}
                      strokeWidth={path.stroke}
                      fill="none"
                    />
                  );
                } else if (path.type === 'text') {
                  return (
                    <SvgText
                      key={index}
                      x={path.x}
                      y={path.y}
                      onMoveShouldSetResponder={() => true}
                      onResponderMove={e => {
                        this.updateTextCordinate(
                          index,
                          e.nativeEvent.locationX,
                          e.nativeEvent.locationY,
                        );
                      }}
                      fontSize={'15'}
                      onLongPress={() => {
                        console.log('update');

                        this.setState({
                          isModalOpen: true,
                          textCordinate: this.state.textCordinate,
                        });
                      }}
                      onPress={() => {
                        this.setState({
                          textCordinate: {
                            x: path.y,
                            y: path.y,
                            index: index,
                          },
                        });
                      }}>
                      {path.text}
                    </SvgText>
                  );
                } else if (path.type === 'image') {
                  return (
                    <SvgImage
                      x={path.x}
                      y={path.y}
                      height={path.height}
                      width={path.width}
                      onMoveShouldSetResponder={() => true}
                      onResponderMove={e => {
                        this.setState({
                          isImagePinch: index,
                          isImagePinchData: path,
                        });
                        this.updateTextCordinate(
                          index,
                          e.nativeEvent.locationX,
                          e.nativeEvent.locationY,
                        );
                      }}
                      xlinkHref={path.image}
                      onPress={() => {
                        this.setState({
                          imagecordinates: {
                            x: path.y,
                            y: path.y,
                            index: index,
                          },
                          textInput: path.text,
                        });
                      }}
                    />
                  );
                } else if (path.type === 'circle') {
                  return (
                    <SvgCircle
                      x={path.x}
                      y={path.y}
                      r={path.radius}
                      stroke={path.color}
                      fill={'none'}
                    />
                  );
                } else if (path.type === 'rectangle') {
                  return (
                    <SvgRectangle
                      x={path.x}
                      y={path.y}
                      height={path.height}
                      width={path.width}
                      stroke={path.color}
                      fill={'none'}
                    />
                  );
                }
              })}
              {this.state.circleCordinate && (
                <SvgCircle
                  x={this.state.circleCordinate.x}
                  y={this.state.circleCordinate.y}
                  r={this.state.circleCordinate.radius}
                  stroke={'#000'}
                  fill={'none'}
                />
              )}
              {this.state.boxCordinate && (
                <SvgRectangle
                  x={this.state.boxCordinate.x}
                  y={this.state.boxCordinate.y}
                  height={this.state.boxCordinate.height}
                  width={this.state.boxCordinate.width}
                  stroke={'#000'}
                  fill={'none'}
                />
              )}
              {this.state.isImagePinch >= 0 && this.state.isImagePinchData && (
                <SvgImage
                  x={this.state.isImagePinchData.x}
                  y={this.state.isImagePinchData.y}
                  height={this.state.isImagePinchData.height}
                  width={this.state.isImagePinchData.width}
                  xlinkHref={this.state.isImagePinchData.image}
                />
              )}
            </Svg>
            <Modal
              animationType="slide"
              transparent={true}
              visible={
                this.state.textInput !== null && !!this.state.textCordinate
              }
              onRequestClose={() => this.setState({textInput: null})}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text>Write Text Below</Text>
                  {this.state.textInput !== null && (
                    <TextInput
                      value={this.state.textInput}
                      onChangeText={text => this.setState({textInput: text})}
                      style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        width: 300,
                        padding: 10,
                        marginTop: 20,
                      }}
                    />
                  )}
                  <TouchableOpacity onPress={this.handleSaveText}>
                    <Text style={{marginTop: 20}}>
                      {this.state.textCordinate?.index !== undefined
                        ? 'Update'
                        : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
          {this.state.fullScreen && (
            <View style={styles.toolscontainer}>
              <View style={styles.fullscreen}>
                <View>
                  <TouchableOpacity testID="historybtnTest">
                    <FontAwesome5 name="history" color="grey" size={23} />
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity
                    testID="showsidebarbtn"
                    onPress={this.showfullscreen}>
                    <SimpleLineIcons
                      name="size-fullscreen"
                      size={20}
                      color="grey"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.linestyle}></View>
              <Text style={styles.shapesheader}>Tools</Text>
              <View style={styles.tools}>
                <TouchableOpacity testID="penbtntest" onPress={this.togglePen}>
                  <FontAwesome5
                    name="pencil-alt"
                    size={20}
                    color={
                      this.state.activetool == 'togglePen' ? 'red' : 'grey'
                    }
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.tools}>
                <TouchableOpacity onPress={() => this.togglehighlighter}>
                  <FontAwesome5
                    name="marker"
                    size={20}
                    color={
                      this.state.activetool == 'togglehighlighter'
                        ? 'red'
                        : 'grey'
                    }
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.tools}>
                <TouchableOpacity
                  testID="highlightertest"
                  onPress={() => this.setState({textInput: ''})}>
                  <MaterialCommunityIcons
                    name="format-color-text"
                    size={28}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.tools}>
                <TouchableOpacity testID="undobtntest">
                  <FontAwesome5
                    onPress={this.handleUndo}
                    name="undo"
                    size={20}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.tools}>
                <TouchableOpacity testID="camerabtntest">
                  <EvilIcons
                    onPress={this.checkPhotoLibraryPermission}
                    name="camera"
                    size={30}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.tools}>
                <TouchableOpacity
                  testID="printbtntest"
                  onPress={this.handlePrint}>
                  <Fontisto name="print" size={22} color="grey" />
                </TouchableOpacity>
              </View>
              <View style={styles.linestyle}></View>
              <Text style={styles.shapesheader}>Shapes</Text>
              <View style={styles.triangle}>
                <View>
                  <TouchableOpacity
                    testID="circleshapebtntest"
                    onPress={() => this.setState({circle: true})}>
                    <MaterialCommunityIcons
                      name="checkbox-blank-circle-outline"
                      size={30}
                      color="grey"
                    />
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity
                    testID="squarebtntest"
                    onPress={() => this.setState({box: true})}>
                    <MaterialCommunityIcons
                      name="square-outline"
                      size={30}
                      color="grey"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.linestyle}></View>
              <Text style={styles.shapesheader}>BackGround Colors</Text>
              <View style={styles.tools}>
                <View style={styles.triangle}>
                  <View>
                    <TouchableOpacity
                      testID="bgcolorbtntest1"
                      onPress={() => this.setState({bgcolor: '#FDEE9E'})}>
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle"
                        size={30}
                        color="#FDEE9E"
                      />
                    </TouchableOpacity>
                  </View>
                  <View>
                    <TouchableOpacity
                      testID="bgcolorbtntest2"
                      onPress={() => this.setState({bgcolor: '#EBEBEB'})}>
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle"
                        size={30}
                        color="#EBEBEB"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.triangle}>
                  <View>
                    <TouchableOpacity
                      testID="bgcolorbtntest3"
                      onPress={() => this.setState({bgcolor: '#FDE0CF'})}>
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle"
                        size={30}
                        color="#FDE0CF"
                      />
                    </TouchableOpacity>
                  </View>
                  <View>
                    <TouchableOpacity
                      testID="bgcolorbtntest4"
                      onPress={() => this.setState({bgcolor: '#CCCCCC'})}>
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle"
                        size={30}
                        color="#CCCCCC"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.linestyle}></View>
                <Text style={styles.shapesheader}>Zoom</Text>
                <View style={styles.zoomtools}>
                  <TouchableOpacity
                    testID="zoominbtntest"
                    onPress={this.handleZoomIn}>
                    <MaterialCommunityIcons
                      color="grey"
                      name="magnify-plus-outline"
                      size={30}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="zoomoutbtntest"
                    onPress={this.handleZoomOut}>
                    <MaterialCommunityIcons
                      color="grey"
                      name="magnify-minus-outline"
                      size={30}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: responsiveHeight(100),
    width: responsiveWidth(100),
  },
  backgroundimage: {
    height: 650,
    width: 310,
  },
  linestyle: {
    borderWidth: 0.5,
    borderColor: 'grey',
  },
  toolscontainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullscreen: {
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tools: {
    margin: 10,
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  triangle: {
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  square: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shapesheader: {
    textAlign: 'center',
  },
  showSidebar: {
    position: 'absolute',
    right: 5,
    top: 5,
  },
  zoomtools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 5,
  },
});

export default BuilderCode;
