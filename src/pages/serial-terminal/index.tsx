import { Button, Col, Form, Row, Select, Space, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';
import { PortSelectOption, SerialForm } from './data';

const { Option } = Select;

const bautRateList = [9600, 14400, 19220, 28800, 38400, 57600, 115200, 230400, 460800, 921600];

const dataBitsList = [8, 7];

const parityList = ['none', 'even', 'odd'];

const stopBitsList = [1, 2];

const SerialTerminal = () => {
  const [serialForm] = Form.useForm<SerialForm>();
  const [ports, setPorts] = useState<PortSelectOption[]>([]);
  const [portIndex, setPortIndex] = useState<number>(0);
  const [selectedPort, setSelectedPort] = useState<any>();
  const [outputs, setOutputs] = useState<string[]>([]);
  const outputRef = useRef<string[]>([]);

  useEffect(() => {
    fetchPort();
  }, []);

  useEffect(() => {
    // @ts-ignore
    navigator.serial.addEventListener('connect', fetchPort);
    // @ts-ignore
    navigator.serial.addEventListener('disconnect', onPortDisconnect);
    return () => {
      // @ts-ignore
      navigator.serial.removeEventListener('connect', fetchPort);
      // @ts-ignore
      navigator.serial.removeEventListener('disconnect', onPortDisconnect);
    };
  }, []);

  useEffect(() => {
    setSelectedPort(ports[portIndex]?.port);
  }, [portIndex, ports]);

  const fetchPort = async () => {
    getConnectedPort();
  };

  const onPortDisconnect = () => {
    message.error('The serial port lost connection!');
    fetchPort();
  };

  const canUseSerial = () => {
    if ('serial' in navigator) {
      // 浏览器支持串口通信
      return true;
    } else {
      message.warning('The browser does not support serial port!');
      return false;
    }
  };

  const openPort = async (port: any) => {
    const data = serialForm.getFieldsValue();
    try {
      // 打开串口
      await port.open({
        dataBits: data.dataBits, // 数据位
        stopBits: data.stopBits, // 停止位
        parity: data.parity, // 奇偶校验
        baudRate: data.baudRate, // 波特率
      });

      outputRef.current = [...outputRef.current, '<Connected>'];
      setOutputs(outputRef.current);

      let reader: any;
      if (data.textDecoder) {
        /**
         * 如果串行设备发送文本返回，可通过TextDecoderStream读取。
         * TextDecoderStream是一个转换流，抓取所有的Uint8Array块并将其转换为字符串。
         */
        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();
      } else {
        reader = port.readable.getReader();
      }

      // 读取串口数据
      while (port.readable) {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              // Allow the serial port to be closed later.
              console.log('done');
              reader.releaseLock();
              break;
            }
            if (value) {
              dealWithData(value);
            }
          }
        } catch (error) {
          // Handle non-fatal read error.
          console.error(error);
        } finally {
          console.log(port.readable);
        }
      }
    } catch (err) {
      console.log(err);
      outputRef.current = [...outputRef.current, `Connect Serial Failed: ${err}`];
      setOutputs(outputRef.current);
    }
  };

  const getConnectedPort = async () => {
    if (!canUseSerial()) return;
    let port;
    // 获取用户之前授予该网站访问权限的所有串口
    // @ts-ignore
    const _ports = await navigator.serial.getPorts();
    setPorts(
      _ports.map((item: any, index: number) => {
        return {
          label: `Port${index + 1}`,
          value: index,
          port: item,
        };
      })
    );
    if (_ports && _ports.length > 0) {
      port = _ports[0];
      setPortIndex(0);
    }
    return port;
  };

  const requestPort = async () => {
    if (!canUseSerial()) return;
    // @ts-ignore
    navigator.serial
      .requestPort()
      .then((port: any) => {
        // 用户选择一个port
        setPorts([
          {
            label: 'Port1',
            value: 0,
            port: port,
          },
        ]);
        setPortIndex(0);
      })
      .catch(() => {
        // The user didn't select a port.
        message.warning('Please select a port to connet!');
      });
  };

  const closePort = async (port: any) => {
    try {
      await port.close();
      outputRef.current = [...outputRef.current, '<Disconnected>'];
      setOutputs(outputRef.current);
    } catch (err) {
      outputRef.current = [...outputRef.current, `Close Serial Failed: ${err}`];
      setOutputs(outputRef.current);
    }
  };

  const dealWithData = (val: string) => {
    // 一个重量变化有时候是发了多次流数据，有时候只发一次流数据
    console.log(val);
    outputRef.current = [...outputRef.current, val];
    setOutputs(outputRef.current);
  };

  return (
    <div className={styles.container}>
      <Form form={serialForm} name="serialForm">
        <Row gutter={[4, 8]} align="bottom">
          <Col span={3}>
            <Form.Item className={styles.selectBox} name="port" label="Port" labelCol={{ span: 24 }}>
              <Select
                className={styles.select}
                style={{ width: '100%' }}
                placeholder="Please select"
                value={portIndex}
                onChange={(val) => {
                  setPortIndex(val);
                }}
              >
                {ports.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
              <Button className={styles.selectButton} onClick={requestPort}>
                Select
              </Button>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="baudRate" label="Baud Rate" labelCol={{ span: 24 }} initialValue={9600}>
              <Select style={{ width: '100%' }} placeholder="Please select">
                {bautRateList.map((item) => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="dataBits" label="Data Bits" labelCol={{ span: 24 }} initialValue={8}>
              <Select style={{ width: '100%' }} placeholder="Please select">
                {dataBitsList.map((item) => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="stopBits" label="Stop Bits" labelCol={{ span: 24 }} initialValue={1}>
              <Select style={{ width: '100%' }} placeholder="Please select">
                {stopBitsList.map((item) => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="parity" label="Parity" labelCol={{ span: 24 }} initialValue={'none'}>
              <Select style={{ width: '100%' }} placeholder="Please select">
                {parityList.map((item) => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="textDecoder" label="Text Decoder" labelCol={{ span: 24 }} initialValue={true}>
              <Select style={{ width: '100%' }} placeholder="Please select">
                <Option key={'true'} value={true}>
                  true
                </Option>
                <Option key={'false'} value={false}>
                  false
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={3} className={styles.searchAlign}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                onClick={() => {
                  openPort(selectedPort);
                }}
              >
                Connect
              </Button>
              <Button
                htmlType="submit"
                onClick={() => {
                  closePort(selectedPort);
                }}
              >
                Close
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
      <div className={styles.outputContainer}>
        {outputs.map((item, index) => (
          <div key={`${item}_${index}`} className={styles.text}>
            &gt; {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SerialTerminal;
