import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import WhiteBoardCollaboration from './Components/WhiteBoardCollaboration';

interface IProps {}

interface IState {}

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }
  render() {
    return (
      <SafeAreaView>
        <WhiteBoardCollaboration />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({});

export default App;
